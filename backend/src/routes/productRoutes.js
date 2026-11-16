import express from 'express';
import db, { logAudit } from '../config/db.js';
import { calculateCreditQuote, getCreditPolicy } from '../services/creditService.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/products/meta (Categories, Brands, Credit Policy)
router.get('/meta', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const brands = db.prepare('SELECT * FROM brands WHERE is_active = 1 ORDER BY name ASC').all();
  const creditPolicy = getCreditPolicy();
  res.json({ categories, brands, creditPolicy });
});

// GET /api/v1/products (Search, Filter, Sort, Deposit Calculation)
router.get('/', (req, res) => {
  const { search, category, brand, credit_only, min_price, max_price, sort = 'newest' } = req.query;

  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           b.name as brand_name, b.slug as brand_slug,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
           COALESCE((SELECT SUM(quantity_available - quantity_reserved) FROM inventory WHERE product_id = p.id), 0) as stock_available
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN brands b ON p.brand_id = b.id
    WHERE p.status = 'PUBLISHED'
  `;
  const params = [];

  if (search) {
    sql += ` AND (p.name LIKE ? OR p.model_number LIKE ? OR p.description LIKE ? OR b.name LIKE ? OR c.name LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (category) {
    sql += ` AND c.slug = ?`;
    params.push(category);
  }
  if (brand) {
    sql += ` AND b.slug = ?`;
    params.push(brand);
  }
  if (credit_only === 'true' || credit_only === '1') {
    sql += ` AND p.is_credit_eligible = 1`;
  }
  if (min_price) {
    sql += ` AND p.retail_price >= ?`;
    params.push(Number(min_price));
  }
  if (max_price) {
    sql += ` AND p.retail_price <= ?`;
    params.push(Number(max_price));
  }

  if (sort === 'price_asc') sql += ` ORDER BY p.retail_price ASC`;
  else if (sort === 'price_desc') sql += ` ORDER BY p.retail_price DESC`;
  else if (sort === 'popular') sql += ` ORDER BY p.sales_count DESC`;
  else sql += ` ORDER BY p.is_featured DESC, p.id DESC`;

  const products = db.prepare(sql).all(...params).map((p) => {
    let creditPreview = null;
    if (p.is_credit_eligible) {
      creditPreview = calculateCreditQuote({
        retailPrice: p.retail_price,
        depositPercentage: p.min_deposit_percentage,
        months: 12,
        productMinDepositPct: p.min_deposit_percentage
      });
    }
    return { ...p, credit_preview: creditPreview };
  });

  res.json({ products });
});

// GET /api/v1/products/:slug
router.get('/:slug', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           b.name as brand_name, b.slug as brand_slug,
           COALESCE((SELECT SUM(quantity_available - quantity_reserved) FROM inventory WHERE product_id = p.id), 0) as stock_available
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN brands b ON p.brand_id = b.id
    WHERE p.slug = ? OR p.id = ?
  `).get(req.params.slug, req.params.slug);

  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC').all(product.id);
  const variants = db.prepare(`
    SELECT v.*, COALESCE(i.quantity_available - i.quantity_reserved, 0) as stock_available
    FROM product_variants v
    LEFT JOIN inventory i ON i.product_variant_id = v.id
    WHERE v.product_id = ? AND v.is_active = 1
  `).all(product.id);
  const attributes = db.prepare('SELECT * FROM product_attributes WHERE product_id = ? ORDER BY sort_order ASC').all(product.id);

  const creditQuote = product.is_credit_eligible
    ? calculateCreditQuote({
        retailPrice: product.retail_price,
        depositPercentage: product.min_deposit_percentage,
        months: 12,
        productMinDepositPct: product.min_deposit_percentage
      })
    : null;

  res.json({ product: { ...product, images, variants, attributes, credit_quote: creditQuote } });
});

// POST /api/v1/products/calculate-credit
router.post('/calculate-credit', (req, res) => {
  const { retail_price, deposit_percentage, months, min_deposit_percentage } = req.body;
  if (!retail_price || retail_price <= 0) {
    return res.status(400).json({ message: 'Valid retail price is required.' });
  }
  const quote = calculateCreditQuote({
    retailPrice: Number(retail_price),
    depositPercentage: deposit_percentage ? Number(deposit_percentage) : null,
    months: months ? Number(months) : 12,
    productMinDepositPct: min_deposit_percentage ? Number(min_deposit_percentage) : null
  });
  res.json(quote);
});

// POST /api/v1/products (Admin / Product Manager)
router.post('/', authenticate, authorizeRoles('system-admin', 'product-manager'), (req, res) => {
  const {
    category_id, brand_id, name, model_number, sku, description,
    retail_price, cost_price = 0, is_credit_eligible = 0,
    min_deposit_percentage = null, warranty_info = '12 Months Warranty',
    image_url, initial_stock = 10
  } = req.body;

  if (!category_id || !brand_id || !name || !model_number || !sku || !retail_price) {
    return res.status(400).json({ message: 'Category, brand, name, model, SKU, and retail price are required.' });
  }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
  const result = db.prepare(`
    INSERT INTO products (category_id, brand_id, name, slug, model_number, sku, description, retail_price, cost_price, is_credit_eligible, min_deposit_percentage, warranty_info, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
  `).run(category_id, brand_id, name, slug, model_number, sku, description || '', Number(retail_price), Number(cost_price), is_credit_eligible ? 1 : 0, min_deposit_percentage, warranty_info);

  const productId = Number(result.lastInsertRowid);
  db.prepare(`INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES (?, ?, ?, 1)`).run(
    productId,
    image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    name
  );
  db.prepare(`INSERT INTO inventory (product_id, product_variant_id, quantity_available) VALUES (?, NULL, ?)`).run(productId, Number(initial_stock));

  logAudit({ userId: req.user.id, action: 'PRODUCT_CREATED', entityType: 'products', entityId: productId, newValues: req.body });
  res.status(201).json({ message: 'Product published.', productId, slug });
});

export default router;