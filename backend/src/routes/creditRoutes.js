import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { logAudit } from '../config/db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { calculateCreditQuote, generateRepaymentSchedule } from '../services/creditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kycUploadDir = path.resolve(__dirname, '../../uploads/kyc');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, kycUploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

// POST /api/v1/credit/applications (Customer submits credit application for an order)
router.post('/applications', authenticate, (req, res) => {
  const {
    order_id, deposit_percentage = 20, repayment_months = 12,
    employment_status, employer_name, employer_contact,
    monthly_gross_income, monthly_net_income, monthly_expenses
  } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND customer_id = ?').get(order_id, req.user.customer_id);
  if (!order) return res.status(404).json({ message: 'Credit order not found.' });

  const quote = calculateCreditQuote({
    retailPrice: order.total_amount,
    depositPercentage: Number(deposit_percentage),
    months: Number(repayment_months)
  });

  // Update order deposit/financed amounts to match selected terms
  db.prepare('UPDATE orders SET deposit_required = ?, financed_amount = ? WHERE id = ?').run(
    quote.deposit_amount, quote.financed_principal, order.id
  );

  const appNumber = `TIR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const result = db.prepare(`
    INSERT INTO credit_applications (
      application_number, customer_id, order_id, status,
      product_retail_price, selected_deposit_amount, proposed_financed_amount,
      repayment_months, estimated_monthly_instalment, interest_rate_annual,
      initiation_fee, monthly_service_fee, employment_status, employer_name,
      employer_contact, monthly_gross_income, monthly_net_income, monthly_expenses, submitted_at
    ) VALUES (?, ?, ?, 'SUBMITTED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    appNumber, req.user.customer_id, order.id,
    order.total_amount, quote.deposit_amount, quote.financed_principal,
    quote.repayment_months, quote.estimated_monthly_instalment, quote.annual_interest_rate_pct,
    quote.initiation_fee, quote.monthly_service_fee, employment_status, employer_name || '',
    employer_contact || '', Number(monthly_gross_income), Number(monthly_net_income), Number(monthly_expenses)
  );

  const appId = Number(result.lastInsertRowid);

  // Create notification
  db.prepare(`
    INSERT INTO notifications (user_id, channel, event_type, title, message, delivery_status, sent_at)
    VALUES (?, 'IN_APP', 'CREDIT_APPLICATION_RECEIVED', 'Credit Application Submitted', ?, 'SENT', datetime('now'))
  `).run(req.user.id, `Your Tirelo Capital credit application ${appNumber} has been received for assessment.`);

  logAudit({ userId: req.user.id, action: 'CREDIT_APP_SUBMITTED', entityType: 'credit_applications', entityId: appId, newValues: { appNumber } });

  res.status(201).json({ message: 'Credit application submitted to Tirelo Capital.', application_id: appId, application_number: appNumber });
});

// POST /api/v1/credit/applications/:id/documents (Upload KYC docs: ID, Payslip, Bank Statement, Proof of Residence)
router.post('/applications/:id/documents', authenticate, upload.single('document'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No document file uploaded.' });
  const { document_type = 'PAYSLIP' } = req.body;

  db.prepare(`
    INSERT INTO credit_documents (credit_application_id, document_type, original_filename, encrypted_storage_path, mime_type, file_size_bytes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, document_type, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);

  res.status(201).json({ message: 'Supporting document uploaded securely.' });
});

// GET /api/v1/credit/my (Customer Credit Applications & Active Financing Accounts)
router.get('/my', authenticate, (req, res) => {
  const applications = db.prepare(`
    SELECT ca.*, o.order_number, o.status as order_status,
           ag.id as agreement_id, ag.agreement_number, ag.accepted_by_customer
    FROM credit_applications ca
    JOIN orders o ON ca.order_id = o.id
    LEFT JOIN credit_agreements ag ON ag.credit_application_id = ca.id
    WHERE ca.customer_id = ?
    ORDER BY ca.id DESC
  `).all(req.user.customer_id);

  for (const app of applications) {
    app.documents = db.prepare('SELECT id, document_type, original_filename, verification_status, uploaded_at FROM credit_documents WHERE credit_application_id = ?').all(app.id);
  }

  const accounts = db.prepare(`
    SELECT acc.*, o.order_number, ca.application_number
    FROM credit_accounts acc
    JOIN orders o ON acc.order_id = o.id
    JOIN credit_applications ca ON acc.credit_application_id = ca.id
    WHERE acc.customer_id = ?
    ORDER BY acc.id DESC
  `).all(req.user.customer_id);

  for (const acc of accounts) {
    acc.schedules = db.prepare('SELECT * FROM repayment_schedules WHERE credit_account_id = ? ORDER BY instalment_number ASC').all(acc.id);
    acc.repayments = db.prepare('SELECT * FROM repayments WHERE credit_account_id = ? ORDER BY id DESC').all(acc.id);
  }

  res.json({ applications, accounts });
});

// POST /api/v1/credit/applications/:id/accept-agreement (Customer signs digital financing agreement -> Activates Account & Order)
router.post('/applications/:id/accept-agreement', authenticate, (req, res) => {
  const app = db.prepare('SELECT * FROM credit_applications WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.customer_id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  if (app.status !== 'AGREEMENT_PENDING') {
    return res.status(400).json({ message: 'Deposit must be paid and application approved before accepting the agreement.' });
  }

  // Mark agreement accepted
  db.prepare(`
    UPDATE credit_agreements
    SET accepted_by_customer = 1, accepted_at = datetime('now'), acceptance_ip_address = ?, acceptance_otp_verified = 1
    WHERE credit_application_id = ?
  `).run(req.ip, app.id);

  // Create Tirelo Capital Financing Account
  const accNumber = `TC-ACC-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const totalPayable = Number((app.estimated_monthly_instalment * app.repayment_months).toFixed(2));
  const totalInterestAndFees = Number((totalPayable - app.proposed_financed_amount).toFixed(2));
  const nextDue = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0];

  const accRes = db.prepare(`
    INSERT INTO credit_accounts (
      account_number, tirelo_account_ref, customer_id, credit_application_id, order_id,
      principal_financed, total_interest_and_fees, total_payable, outstanding_balance,
      monthly_instalment, term_months, next_payment_date, status, activated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
  `).run(
    accNumber, `EXT-${accNumber}`, app.customer_id, app.id, app.order_id,
    app.proposed_financed_amount, totalInterestAndFees, totalPayable, totalPayable,
    app.estimated_monthly_instalment, app.repayment_months, nextDue
  );

  const accountId = Number(accRes.lastInsertRowid);
  db.prepare('UPDATE credit_agreements SET credit_account_id = ? WHERE credit_application_id = ?').run(accountId, app.id);

  // Generate monthly instalment schedule
  generateRepaymentSchedule(accountId, app.proposed_financed_amount, totalInterestAndFees, app.estimated_monthly_instalment, app.repayment_months);

  // Activate application & release order to PROCESSING
  db.prepare(`UPDATE credit_applications SET status = 'ACTIVE', updated_at = datetime('now') WHERE id = ?`).run(app.id);
  db.prepare(`UPDATE orders SET status = 'PROCESSING', updated_at = datetime('now') WHERE id = ?`).run(app.order_id);

  // Deduct stock permanently
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(app.order_id);
  for (const item of items) {
    db.prepare('UPDATE products SET sales_count = sales_count + ? WHERE id = ?').run(item.quantity, item.product_id);
    if (item.product_variant_id) {
      db.prepare('UPDATE inventory SET quantity_available = MAX(0, quantity_available - ?), quantity_reserved = MAX(0, quantity_reserved - ?) WHERE product_variant_id = ?').run(item.quantity, item.quantity, item.product_variant_id);
    } else {
      db.prepare('UPDATE inventory SET quantity_available = MAX(0, quantity_available - ?), quantity_reserved = MAX(0, quantity_reserved - ?) WHERE product_id = ? AND product_variant_id IS NULL').run(item.quantity, item.quantity, item.product_id);
    }
  }

  logAudit({ userId: req.user.id, action: 'CREDIT_AGREEMENT_ACCEPTED', entityType: 'credit_accounts', entityId: accountId, newValues: { accNumber } });
  res.json({ message: 'Financing agreement accepted! Your account is active and order is now processing.', account_number: accNumber });
});

// ============================================================================
// TIRELO CAPITAL PORTAL ENDPOINTS (Restricted to Tirelo Officers & Admins)
// ============================================================================

// GET /api/v1/credit/portal/applications
router.get('/portal/applications', authenticate, authorizeRoles('tirelo-credit-officer', 'tirelo-finance-admin'), (req, res) => {
  const apps = db.prepare(`
    SELECT ca.*, o.order_number, o.status as order_status,
           u.first_name, u.surname, u.email, u.mobile_number, c.id_number
    FROM credit_applications ca
    JOIN orders o ON ca.order_id = o.id
    JOIN customers c ON ca.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    ORDER BY ca.id DESC
  `).all();

  for (const app of apps) {
    app.documents = db.prepare('SELECT * FROM credit_documents WHERE credit_application_id = ?').all(app.id);
    app.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(app.order_id);
  }
  res.json({ applications: apps });
});

// POST /api/v1/credit/portal/applications/:id/decide (Approve / Decline / Request Docs)
router.post('/portal/applications/:id/decide', authenticate, authorizeRoles('tirelo-credit-officer'), (req, res) => {
  const { decision, decision_reason } = req.body;
  if (!['APPROVED', 'DECLINED', 'DOCUMENTS_REQUIRED'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be APPROVED, DECLINED, or DOCUMENTS_REQUIRED.' });
  }

  const app = db.prepare(`
    SELECT ca.*, c.user_id
    FROM credit_applications ca
    JOIN customers c ON ca.customer_id = c.id
    WHERE ca.id = ?
  `).get(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });

  const nextAppStatus = decision === 'APPROVED' ? 'DEPOSIT_PENDING' : decision;

  db.prepare(`
    UPDATE credit_applications
    SET status = ?, assessed_by_user_id = ?, decision_reason = ?, decided_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(nextAppStatus, req.user.id, decision_reason || '', app.id);

  if (decision === 'APPROVED') {
    db.prepare(`UPDATE orders SET status = 'CREDIT_APPROVED', updated_at = datetime('now') WHERE id = ?`).run(app.order_id);
    // Generate draft credit agreement ready for after deposit payment
    const agrNum = `AGR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    db.prepare(`
      INSERT OR IGNORE INTO credit_agreements (agreement_number, credit_application_id, document_pdf_path, terms_version)
      VALUES (?, ?, ?, 'NCA-2026-V1')
    `).run(agrNum, app.id, `/agreements/${agrNum}.pdf`);
  } else if (decision === 'DECLINED') {
    db.prepare(`UPDATE orders SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?`).run(app.order_id);
  }

  db.prepare(`
    INSERT INTO notifications (user_id, channel, event_type, title, message, delivery_status, sent_at)
    VALUES (?, 'IN_APP', 'CREDIT_DECISION', ?, ?, 'SENT', datetime('now'))
  `).run(
    app.user_id,
    `Credit Application ${decision}`,
    decision === 'APPROVED'
      ? `Congratulations! Application ${app.application_number} is approved. Please pay your deposit of R${app.selected_deposit_amount.toFixed(2)} to proceed.`
      : `Update on application ${app.application_number}: ${decision_reason || decision}`
  );

  logAudit({ userId: req.user.id, action: `CREDIT_APP_${decision}`, entityType: 'credit_applications', entityId: app.id, newValues: { decision, decision_reason } });
  res.json({ message: `Application marked as ${nextAppStatus}.` });
});

// GET /api/v1/credit/portal/accounts (Tirelo Finance Admin: Active Accounts & Collections)
router.get('/portal/accounts', authenticate, authorizeRoles('tirelo-credit-officer', 'tirelo-finance-admin'), (req, res) => {
  const accounts = db.prepare(`
    SELECT acc.*, u.first_name, u.surname, u.email, u.mobile_number, c.id_number, o.order_number
    FROM credit_accounts acc
    JOIN customers c ON acc.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN orders o ON acc.order_id = o.id
    ORDER BY acc.id DESC
  `).all();

  for (const acc of accounts) {
    acc.schedules = db.prepare('SELECT * FROM repayment_schedules WHERE credit_account_id = ? ORDER BY instalment_number ASC').all(acc.id);
    acc.repayments = db.prepare('SELECT * FROM repayments WHERE credit_account_id = ? ORDER BY id DESC').all(acc.id);
  }
  res.json({ accounts });
});

// POST /api/v1/credit/portal/accounts/:id/repayments (Record a customer instalment repayment)
router.post('/portal/accounts/:id/repayments', authenticate, authorizeRoles('tirelo-finance-admin'), (req, res) => {
  const { amount, payment_channel = 'DEBIT_ORDER', external_receipt_ref } = req.body;
  const account = db.prepare('SELECT * FROM credit_accounts WHERE id = ?').get(req.params.id);
  if (!account) return res.status(404).json({ message: 'Financing account not found.' });

  const paidAmount = Number(amount);
  const nextSchedule = db.prepare(`SELECT * FROM repayment_schedules WHERE credit_account_id = ? AND status != 'PAID' ORDER BY instalment_number ASC LIMIT 1`).get(account.id);

  const repRef = `REP-${Date.now()}`;
  db.prepare(`
    INSERT INTO repayments (repayment_reference, credit_account_id, repayment_schedule_id, payment_channel, amount, payment_date, recorded_by_user_id, external_receipt_ref)
    VALUES (?, ?, ?, ?, ?, date('now'), ?, ?)
  `).run(repRef, account.id, nextSchedule ? nextSchedule.id : null, payment_channel, paidAmount, req.user.id, external_receipt_ref || null);

  if (nextSchedule) {
    const newPaid = nextSchedule.amount_paid + paidAmount;
    const schedStatus = newPaid >= nextSchedule.total_instalment_due ? 'PAID' : 'PARTIALLY_PAID';
    db.prepare(`UPDATE repayment_schedules SET amount_paid = ?, status = ?, paid_at = datetime('now') WHERE id = ?`).run(newPaid, schedStatus, nextSchedule.id);
  }

  const newBalance = Math.max(0, Number((account.outstanding_balance - paidAmount).toFixed(2)));
  const newAccStatus = newBalance === 0 ? 'SETTLED' : 'ACTIVE';
  db.prepare(`UPDATE credit_accounts SET outstanding_balance = ?, status = ? WHERE id = ?`).run(newBalance, newAccStatus, account.id);

  logAudit({ userId: req.user.id, action: 'REPAYMENT_RECORDED', entityType: 'credit_accounts', entityId: account.id, newValues: { repRef, paidAmount, newBalance } });
  res.status(201).json({ message: 'Repayment recorded and balance updated.', outstanding_balance: newBalance });
});

export default router;