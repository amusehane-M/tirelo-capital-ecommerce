import express from 'express';
import db from '../config/db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/admin/dashboard (Centralized Executive KPIs - URS Section 8)
router.get('/dashboard', authenticate, authorizeRoles('system-admin', 'product-manager', 'inventory-manager', 'order-manager', 'tirelo-credit-officer', 'tirelo-finance-admin'), (req, res) => {
  const stats = {
    total_customers: db.prepare('SELECT COUNT(*) as c FROM customers').get().c,
    total_products: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    total_orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    cash_sales_total: db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as s FROM orders WHERE purchase_type = 'CASH' AND status NOT IN ('PENDING_PAYMENT', 'CANCELLED')`).get().s,
    credit_sales_total: db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as s FROM orders WHERE purchase_type = 'CREDIT' AND status NOT IN ('CREDIT_APPLICATION_PENDING', 'CANCELLED')`).get().s,
    deposits_collected: db.prepare(`SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE payment_type = 'CREDIT_DEPOSIT' AND status = 'VERIFIED'`).get().s,
    total_financed_principal: db.prepare(`SELECT COALESCE(SUM(principal_financed), 0) as s FROM credit_accounts`).get().s,
    outstanding_credit_balance: db.prepare(`SELECT COALESCE(SUM(outstanding_balance), 0) as s FROM credit_accounts WHERE status IN ('ACTIVE', 'ARREARS')`).get().s,
    pending_credit_apps: db.prepare(`SELECT COUNT(*) as c FROM credit_applications WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')`).get().c,
    low_stock_items: db.prepare(`SELECT COUNT(*) as c FROM inventory WHERE (quantity_available - quantity_reserved) <= low_stock_threshold`).get().c
  };

  const recentOrders = db.prepare(`
    SELECT o.*, u.first_name, u.surname, u.email
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON c.user_id = u.id
    ORDER BY o.id DESC LIMIT 20
  `).all();

  const inventory = db.prepare(`
    SELECT i.*, p.name as product_name, p.sku, v.variant_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN product_variants v ON i.product_variant_id = v.id
    ORDER BY (i.quantity_available - i.quantity_reserved) ASC
  `).all();

  const auditLogs = db.prepare(`
    SELECT a.*, u.email as user_email
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC LIMIT 25
  `).all();

  res.json({ stats, recentOrders, inventory, auditLogs });
});

// PATCH /api/v1/admin/inventory/:id
router.patch('/inventory/:id', authenticate, authorizeRoles('system-admin', 'inventory-manager'), (req, res) => {
  const { quantity_available } = req.body;
  db.prepare(`UPDATE inventory SET quantity_available = ?, updated_at = datetime('now') WHERE id = ?`).run(Number(quantity_available), req.params.id);
  res.json({ message: 'Inventory updated.' });
});

export default router;