import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare(`
      SELECT u.id, u.role_id, u.first_name, u.surname, u.email, u.mobile_number, u.is_active,
             r.slug as role_slug, r.name as role_name, r.organization,
             c.id as customer_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN customers c ON c.user_id = u.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Account inactive or not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

export function authorizeRoles(...allowedSlugs) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
    if (req.user.role_slug === 'super-admin' || allowedSlugs.includes(req.user.role_slug)) {
      return next();
    }
    return res.status(403).json({
      message: `Access denied. Required role: ${allowedSlugs.join(' or ')}.`
    });
  };
}