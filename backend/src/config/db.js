import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../../');
const dbPath = path.join(rootDir, 'database', 'tt_unik.db');
const schemaPath = path.join(rootDir, 'database', 'schema', 'sqlite_schema.sql');
const seedPath = path.join(rootDir, 'database', 'seeds', 'sqlite_seed.sql');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initializeDatabase() {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  const seedSql = fs.readFileSync(seedPath, 'utf8');
  db.exec(seedSql);

  // Seed default test users with real bcrypt hashes if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('Password@123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (role_id, first_name, surname, email, mobile_number, email_verified_at, password)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    `);

    // 1: Super Admin (TT UNIK)
    insertUser.run(9, 'Thabo', 'Mokoena', 'superadmin@ttunik.co.za', '+27820000001', hash);
    // 2: Tirelo Capital Credit Officer
    insertUser.run(7, 'Lerato', 'Khumalo', 'credit.officer@tirelocapital.co.za', '+27820000002', hash);
    // 3: Tirelo Capital Finance Admin
    insertUser.run(8, 'Sipho', 'Ndlovu', 'finance.admin@tirelocapital.co.za', '+27820000003', hash);
    // 4: Demo Registered Customer
    const custUser = insertUser.run(2, 'Naledi', 'Dlamini', 'customer@example.co.za', '+27821112222', hash);

    const custResult = db.prepare(`
      INSERT INTO customers (user_id, id_type, id_number, date_of_birth, popia_consent_given, popia_consent_at)
      VALUES (?, 'SA_ID', '9504125089081', '1995-04-12', 1, datetime('now'))
    `).run(custUser.lastInsertRowid);

    db.prepare(`
      INSERT INTO customer_addresses (customer_id, address_type, street_address, suburb, city, province, postal_code, is_default)
      VALUES (?, 'DELIVERY', '42 Rivonia Road', 'Sandton', 'Johannesburg', 'Gauteng', '2196', 1)
    `).run(custResult.lastInsertRowid);

    console.log('Seeded default users (Password: Password@123)');
  }
  console.log(`SQLite database ready at: ${dbPath}`);
}

export function logAudit({ userId = null, action, entityType, entityId = null, oldValues = null, newValues = null, ip = null }) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ip
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

export default db;