import express from 'express';
import db, { logAudit } from '../config/db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { calculateCreditQuote } from '../services/creditService.js';

const router = express.Router();

// POST /api/v1/orders/checkout (Cash or Credit Order Creation + Stock Reservation)
router.post('/checkout', authenticate, (req, res) => {
  if (!req.user.customer_id) {
    return res.status(403).json({ message: 'Only registered customers can place orders.' });
  }

  const { items, delivery_address_id, purchase_type = 'CASH', deposit_percentage = 20, repayment_months = 12, promotion_code } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart cannot be empty.' });
  }
  if (!delivery_address_id) {
    return res.status(400).json({ message: 'Please select a delivery address.' });
  }

  let subtotal = 0;
  const resolvedItems = [];

  for (const item of items) {
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'PUBLISHED'").get(item.product_id);
    if (!product) return res.status(404).json({ message: `Product ID ${item.product_id} not found.` });

    if (purchase_type === 'CREDIT' && !product.is_credit_eligible) {
      return res.status(400).json({ message: `${product.name} is not eligible for Buy on Credit.` });
    }

    let unitPrice = product.retail_price;
    let variantSnapshot = null;
    let skuSnapshot = product.sku;

    if (item.product_variant_id) {
      const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(item.product_variant_id, product.id);
      if (variant) {
        unitPrice += variant.price_adjustment;
        variantSnapshot = variant.variant_name;
        skuSnapshot = variant.sku;
      }
    }

    const qty = Number(item.quantity || 1);
    const lineTotal = Number((unitPrice * qty).toFixed(2));
    subtotal += lineTotal;

    resolvedItems.push({
      product_id: product.id,
      product_variant_id: item.product_variant_id || null,
      product_name_snapshot: product.name,
      sku_snapshot: skuSnapshot,
      variant_snapshot: variantSnapshot,
      quantity: qty,
      unit_price: unitPrice,
      line_total: lineTotal,
      min_deposit_percentage: product.min_deposit_percentage
    });
  }

  // Delivery fee calculation
  const deliveryFee = subtotal >= 2500 ? 0 : 150;
  let discountAmount = 0;
  let promotionId = null;

  if (promotion_code) {
    const promo = db.prepare(`SELECT * FROM promotions WHERE code = ? AND is_active = 1`).get(promotion_code.toUpperCase());
    if (promo && subtotal >= promo.min_order_amount && (purchase_type === 'CASH' || promo.applies_to_credit)) {
      promotionId = promo.id;
      discountAmount = promo.discount_type === 'PERCENTAGE'
        ? Number(((subtotal * promo.discount_value) / 100).toFixed(2))
        : Number(promo.discount_value);
    }
  }

  const totalAmount = Number((subtotal - discountAmount + deliveryFee).toFixed(2));
  let depositRequired = 0;
  let financedAmount = 0;
  let creditQuote = null;

  if (purchase_type === 'CREDIT') {
    const highestMinPct = resolvedItems.reduce((max, i) => Math.max(max, i.min_deposit_percentage || 20), 20);
    creditQuote = calculateCreditQuote({
      retailPrice: totalAmount,
      depositPercentage: deposit_percentage,
      months: repayment_months,
      productMinDepositPct: highestMinPct
    });
    depositRequired = creditQuote.deposit_amount;
    financedAmount = creditQuote.financed_principal;
  }

  const orderNumber = `TTU-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const initialStatus = purchase_type === 'CREDIT' ? 'CREDIT_APPLICATION_PENDING' : 'PENDING_PAYMENT';

  const orderRes = db.prepare(`
    INSERT INTO orders (
      order_number, customer_id, delivery_address_id, promotion_id, purchase_type, status,
      subtotal_amount, discount_amount, delivery_fee, total_amount, deposit_required, financed_amount,
      stock_reserved_until
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 minutes'))
  `).run(
    orderNumber, req.user.customer_id, delivery_address_id, promotionId, purchase_type, initialStatus,
    subtotal, discountAmount, deliveryFee, totalAmount, depositRequired, financedAmount
  );

  const orderId = Number(orderRes.lastInsertRowid);

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_variant_id, product_name_snapshot, sku_snapshot, variant_snapshot, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of resolvedItems) {
    insertItem.run(orderId, item.product_id, item.product_variant_id, item.product_name_snapshot, item.sku_snapshot, item.variant_snapshot, item.quantity, item.unit_price, item.line_total);
    // Reserve stock
    if (item.product_variant_id) {
      db.prepare('UPDATE inventory SET quantity_reserved = quantity_reserved + ? WHERE product_variant_id = ?').run(item.quantity, item.product_variant_id);
    } else {
      db.prepare('UPDATE inventory SET quantity_reserved = quantity_reserved + ? WHERE product_id = ? AND product_variant_id IS NULL').run(item.quantity, item.product_id);
    }
  }

  logAudit({ userId: req.user.id, action: 'ORDER_CREATED', entityType: 'orders', entityId: orderId, newValues: { orderNumber, purchase_type, totalAmount } });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ order, creditQuote });
});

// POST /api/v1/orders/:id/pay (Simulates Payment Gateway Verification for Cash or Credit Deposit)
router.post('/:id/pay', authenticate, (req, res) => {
  const { gateway_provider = 'PayFast Sandbox' } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.customer_id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const isDeposit = order.purchase_type === 'CREDIT';
  const amountDue = isDeposit ? order.deposit_required : order.total_amount;
  const paymentType = isDeposit ? 'CREDIT_DEPOSIT' : 'FULL_CASH';

  if (isDeposit) {
    const app = db.prepare('SELECT * FROM credit_applications WHERE order_id = ?').get(order.id);
    if (!app || !['APPROVED', 'DEPOSIT_PENDING'].includes(app.status)) {
      return res.status(400).json({ message: 'Credit application must be approved by Tirelo Capital before paying the deposit.' });
    }
  }

  const paymentRef = `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  db.prepare(`
    INSERT INTO payments (payment_reference, order_id, customer_id, payment_type, gateway_provider, gateway_transaction_id, amount, status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'VERIFIED', datetime('now'))
  `).run(paymentRef, order.id, req.user.customer_id, paymentType, gateway_provider, `GW-${Date.now()}`, amountDue);

  if (isDeposit) {
    db.prepare(`UPDATE orders SET status = 'DEPOSIT_PAID', updated_at = datetime('now') WHERE id = ?`).run(order.id);
    db.prepare(`UPDATE credit_applications SET status = 'AGREEMENT_PENDING', updated_at = datetime('now') WHERE order_id = ?`).run(order.id);
  } else {
    db.prepare(`UPDATE orders SET status = 'PROCESSING', updated_at = datetime('now') WHERE id = ?`).run(order.id);
    // Deduct confirmed stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const item of items) {
      db.prepare('UPDATE products SET sales_count = sales_count + ? WHERE id = ?').run(item.quantity, item.product_id);
      if (item.product_variant_id) {
        db.prepare('UPDATE inventory SET quantity_available = MAX(0, quantity_available - ?), quantity_reserved = MAX(0, quantity_reserved - ?) WHERE product_variant_id = ?').run(item.quantity, item.quantity, item.product_variant_id);
      } else {
        db.prepare('UPDATE inventory SET quantity_available = MAX(0, quantity_available - ?), quantity_reserved = MAX(0, quantity_reserved - ?) WHERE product_id = ? AND product_variant_id IS NULL').run(item.quantity, item.quantity, item.product_id);
      }
    }
  }

  logAudit({ userId: req.user.id, action: 'PAYMENT_VERIFIED', entityType: 'orders', entityId: order.id, newValues: { paymentRef, amountDue, paymentType } });
  res.json({ message: 'Payment verified successfully.', payment_reference: paymentRef });
});

// GET /api/v1/orders/my (Customer Order History)
router.get('/my', authenticate, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, ca.id as credit_application_id, ca.application_number, ca.status as credit_status
    FROM orders o
    LEFT JOIN credit_applications ca ON ca.order_id = o.id
    WHERE o.customer_id = ?
    ORDER BY o.id DESC
  `).all(req.user.customer_id);

  for (const ord of orders) {
    ord.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
  }
  res.json({ orders });
});

// PATCH /api/v1/orders/:id/status (TT UNIK Order Manager)
router.patch('/:id/status', authenticate, authorizeRoles('system-admin', 'order-manager'), (req, res) => {
  const { status, courier_name, tracking_number } = req.body;
  db.prepare(`
    UPDATE orders SET status = ?, courier_name = COALESCE(?, courier_name), tracking_number = COALESCE(?, tracking_number), updated_at = datetime('now')
    WHERE id = ?
  `).run(status, courier_name || null, tracking_number || null, req.params.id);

  logAudit({ userId: req.user.id, action: 'ORDER_STATUS_UPDATED', entityType: 'orders', entityId: Number(req.params.id), newValues: { status, courier_name, tracking_number } });
  res.json({ message: 'Order status updated.' });
});

export default router;