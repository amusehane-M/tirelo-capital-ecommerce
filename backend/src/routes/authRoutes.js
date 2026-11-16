import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { logAudit } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
  const {
    first_name, surname, id_type = 'SA_ID', id_number, date_of_birth,
    email, mobile_number, password, popia_consent,
    street_address, suburb, city, province, postal_code
  } = req.body;

  if (!first_name || !surname || !id_number || !email || !mobile_number || !password) {
    return res.status(400).json({ message: 'All required personal and contact fields must be provided.' });
  }
  if (!popia_consent) {
    return res.status(400).json({ message: 'POPIA consent is required to register an account.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR mobile_number = ?').get(email.toLowerCase(), mobile_number);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email or mobile number already exists.' });
    }

    const customerRole = db.prepare(`SELECT id FROM roles WHERE slug = 'registered-customer'`).get();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const userRes = db.prepare(`
      INSERT INTO users (role_id, first_name, surname, email, mobile_number, email_verified_at, password)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    `).run(customerRole.id, first_name, surname, email.toLowerCase(), mobile_number, hashedPassword);

    const custRes = db.prepare(`
      INSERT INTO customers (user_id, id_type, id_number, date_of_birth, popia_consent_given, popia_consent_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).run(userRes.lastInsertRowid, id_type, id_number, date_of_birth || null);

    if (street_address && city && province && postal_code) {
      db.prepare(`
        INSERT INTO customer_addresses (customer_id, address_type, street_address, suburb, city, province, postal_code, is_default)
        VALUES (?, 'DELIVERY', ?, ?, ?, ?, ?, 1)
      `).run(custRes.lastInsertRowid, street_address, suburb || '', city, province, postal_code);
    }

    logAudit({ userId: Number(userRes.lastInsertRowid), action: 'CUSTOMER_REGISTERED', entityType: 'users', entityId: Number(userRes.lastInsertRowid), ip: req.ip });

    const token = jwt.sign({ userId: Number(userRes.lastInsertRowid) }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    return res.status(201).json({ message: 'Registration successful.', token });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare(`
    SELECT u.*, r.slug as role_slug, r.name as role_name, r.organization, c.id as customer_id
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN customers c ON c.user_id = u.id
    WHERE u.email = ?
  `).get(email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  if (!user.is_active) {
    return res.status(403).json({ message: 'Your account has been deactivated. Contact support.' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  logAudit({ userId: user.id, action: 'USER_LOGIN', entityType: 'users', entityId: user.id, ip: req.ip });

  const { password: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, (req, res) => {
  let addresses = [];
  if (req.user.customer_id) {
    addresses = db.prepare('SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC').all(req.user.customer_id);
  }
  res.json({ user: req.user, addresses });
});

// POST /api/v1/auth/addresses
router.post('/addresses', authenticate, (req, res) => {
  if (!req.user.customer_id) return res.status(400).json({ message: 'Customer profile required.' });
  const { street_address, suburb, city, province, postal_code, is_default = 1 } = req.body;
  if (!street_address || !city || !province || !postal_code) {
    return res.status(400).json({ message: 'Street address, city, province, and postal code are required.' });
  }
  if (is_default) {
    db.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?').run(req.user.customer_id);
  }
  const result = db.prepare(`
    INSERT INTO customer_addresses (customer_id, address_type, street_address, suburb, city, province, postal_code, is_default)
    VALUES (?, 'DELIVERY', ?, ?, ?, ?, ?, ?)
  `).run(req.user.customer_id, street_address, suburb || '', city, province, postal_code, is_default ? 1 : 0);

  const address = db.prepare('SELECT * FROM customer_addresses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ address });
});

export default router;