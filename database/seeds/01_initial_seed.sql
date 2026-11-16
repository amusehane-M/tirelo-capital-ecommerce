USE tt_unik_ecommerce;

-- 1. Seed the 9 System Roles (URS Section 2)
INSERT INTO roles (id, name, slug, organization, description) VALUES
(1, 'Guest Customer', 'guest-customer', 'CUSTOMER', 'Browse products, search and view product information.'),
(2, 'Registered Customer', 'registered-customer', 'CUSTOMER', 'Manage profile, purchase products, apply for credit and track orders.'),
(3, 'System Administrator', 'system-admin', 'TT_UNIK', 'Manage the E-Commerce platform and configurations.'),
(4, 'Product Manager', 'product-manager', 'TT_UNIK', 'Manage products, categories, prices, images and specifications.'),
(5, 'Inventory Manager', 'inventory-manager', 'TT_UNIK', 'Manage stock levels and product availability.'),
(6, 'Order Manager', 'order-manager', 'TT_UNIK', 'Process and manage customer orders.'),
(7, 'Tirelo Capital Credit Officer', 'tirelo-credit-officer', 'TIRELO_CAPITAL', 'Review, assess and manage credit applications.'),
(8, 'Tirelo Capital Finance Administrator', 'tirelo-finance-admin', 'TIRELO_CAPITAL', 'Manage financing accounts, repayments and collections.'),
(9, 'Super Administrator', 'super-admin', 'TT_UNIK', 'Manage system users, roles, permissions and high-level settings.');

-- 2. Seed Default Administrative & Tirelo Test Accounts (Password: Password@123)
-- Hash generated via bcrypt ($2y$10$...)
INSERT INTO users (id, role_id, first_name, surname, email, mobile_number, email_verified_at, password) VALUES
(1, 9, 'Thabo', 'Mokoena', 'superadmin@ttunik.co.za', '+27820000001', NOW(), '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 7, 'Lerato', 'Khumalo', 'credit.officer@tirelocapital.co.za', '+27820000002', NOW(), '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 8, 'Sipho', 'Ndlovu', 'finance.admin@tirelocapital.co.za', '+27820000003', NOW(), '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 3. Seed the 10 Product Categories (URS Section 3.3)
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
(1, 'Smartphones and cellphones', 'smartphones-cellphones', 'Latest Android and iOS smartphones eligible for cash or Tirelo credit.', 1),
(2, 'Laptops and notebooks', 'laptops-notebooks', 'Business, student, and gaming laptops.', 2),
(3, 'Desktop computers', 'desktop-computers', 'Workstations, towers, and all-in-one PCs.', 3),
(4, 'Tablets and iPads', 'tablets-ipads', 'Portable tablets and stylus-enabled devices.', 4),
(5, 'Computer accessories', 'computer-accessories', 'Keyboards, mice, webcams, and docking stations.', 5),
(6, 'Networking equipment', 'networking-equipment', 'Routers, switches, LTE/5G modems, and access points.', 6),
(7, 'Printers and scanners', 'printers-scanners', 'Laser, inkjet, and multifunction office printers.', 7),
(8, 'Storage devices', 'storage-devices', 'External SSDs, NVMe drives, and flash storage.', 8),
(9, 'Computer components', 'computer-components', 'RAM, GPUs, motherboards, and power supplies.', 9),
(10, 'Electronic accessories', 'electronic-accessories', 'Chargers, power banks, cables, and protective cases.', 10);

-- 4. Seed Brands
INSERT INTO brands (id, name, slug, is_popular) VALUES
(1, 'Apple', 'apple', TRUE),
(2, 'Samsung', 'samsung', TRUE),
(3, 'Dell', 'dell', TRUE),
(4, 'HP', 'hp', TRUE),
(5, 'Lenovo', 'lenovo', TRUE),
(6, 'ASUS', 'asus', FALSE),
(7, 'TP-Link', 'tp-link', FALSE);

-- 5. Seed Sample Products (Including URS Section 4.1 R12,000.00 Reference Product)
INSERT INTO products (id, category_id, brand_id, name, slug, model_number, sku, description, retail_price, cost_price, is_credit_eligible, min_deposit_percentage, warranty_info, status, is_featured) VALUES
(1, 1, 2, 'Samsung Galaxy S24 FE 5G', 'samsung-galaxy-s24-fe-5g', 'SM-S721B', 'TTU-SAM-S24FE', '6.7-inch Dynamic AMOLED 2X display, Exynos 2400e, 50MP pro-grade camera.', 12000.00, 9600.00, TRUE, 25.00, '24 Months Samsung South Africa Warranty', 'PUBLISHED', TRUE),
(2, 2, 3, 'Dell Latitude 5540 Core i7', 'dell-latitude-5540-core-i7', 'LAT-5540-I7', 'TTU-DEL-5540', '13th Gen Intel Core i7, 16GB DDR4 RAM, 512GB NVMe SSD, Windows 11 Pro.', 18500.00, 15200.00, TRUE, 20.00, '36 Months Dell ProSupport Warranty', 'PUBLISHED', TRUE),
(3, 5, 5, 'Lenovo ThinkPad Universal USB-C Dock', 'lenovo-thinkpad-usb-c-dock', '40AY0090EU', 'TTU-LEN-DOCK', 'Universal USB-C docking station with dual 4K display output.', 3200.00, 2450.00, FALSE, NULL, '12 Months Carry-In Warranty', 'PUBLISHED', FALSE);

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, '/images/products/samsung-s24-fe.webp', 'Samsung Galaxy S24 FE 5G', TRUE, 1),
(2, '/images/products/dell-latitude-5540.webp', 'Dell Latitude 5540 Laptop', TRUE, 1),
(3, '/images/products/lenovo-usbc-dock.webp', 'Lenovo USB-C Dock', TRUE, 1);

INSERT INTO product_variants (id, product_id, sku, variant_name, colour, ram_capacity, storage_capacity, price_adjustment) VALUES
(1, 1, 'TTU-SAM-S24FE-128-BLK', '128GB / Graphite', 'Graphite', '8GB', '128GB', 0.00),
(2, 1, 'TTU-SAM-S24FE-256-BLU', '256GB / Blue', 'Blue', '8GB', '256GB', 1500.00),
(3, 2, 'TTU-DEL-5540-16-512', '16GB RAM / 512GB SSD', 'Silver', '16GB', '512GB', 0.00),
(4, 2, 'TTU-DEL-5540-32-1TB', '32GB RAM / 1TB SSD', 'Silver', '32GB', '1TB', 3500.00);

INSERT INTO inventory (product_id, product_variant_id, quantity_available, quantity_reserved, low_stock_threshold) VALUES
(1, 1, 25, 0, 5),
(1, 2, 15, 0, 5),
(2, 3, 12, 0, 3),
(2, 4, 6, 0, 2),
(3, NULL, 40, 0, 10);

-- 6. Seed Configurable Tirelo Capital Credit Policy & Store Settings (URS Section 4.3 & 10)
INSERT INTO system_settings (setting_group, setting_key, setting_value, value_type, is_public) VALUES
('TIRELO_CREDIT', 'default_min_deposit_pct', '20', 'NUMBER', TRUE),
('TIRELO_CREDIT', 'allowed_deposit_percentages', '[15, 20, 25, 30, 40, 50]', 'JSON', TRUE),
('TIRELO_CREDIT', 'allowed_repayment_months', '[6, 12, 18, 24, 36]', 'JSON', TRUE),
('TIRELO_CREDIT', 'annual_interest_rate_pct', '21.5', 'NUMBER', TRUE),
('TIRELO_CREDIT', 'initiation_fee_zar', '1207.50', 'NUMBER', TRUE),
('TIRELO_CREDIT', 'monthly_service_fee_zar', '69.00', 'NUMBER', TRUE),
('TIRELO_CREDIT', 'min_credit_eligible_price_zar', '3500.00', 'NUMBER', TRUE),
('STORE', 'standard_delivery_fee_zar', '150.00', 'NUMBER', TRUE),
('STORE', 'free_delivery_threshold_zar', '2500.00', 'NUMBER', TRUE),
('STORE', 'stock_reservation_minutes', '30', 'NUMBER', FALSE);