INSERT OR IGNORE INTO roles (id, name, slug, organization, description) VALUES
(1, 'Guest Customer', 'guest-customer', 'CUSTOMER', 'Browse products, search and view product information.'),
(2, 'Registered Customer', 'registered-customer', 'CUSTOMER', 'Manage profile, purchase products, apply for credit and track orders.'),
(3, 'System Administrator', 'system-admin', 'TT_UNIK', 'Manage the E-Commerce platform and configurations.'),
(4, 'Product Manager', 'product-manager', 'TT_UNIK', 'Manage products, categories, prices, images and specifications.'),
(5, 'Inventory Manager', 'inventory-manager', 'TT_UNIK', 'Manage stock levels and product availability.'),
(6, 'Order Manager', 'order-manager', 'TT_UNIK', 'Process and manage customer orders.'),
(7, 'Tirelo Capital Credit Officer', 'tirelo-credit-officer', 'TIRELO_CAPITAL', 'Review, assess and manage credit applications.'),
(8, 'Tirelo Capital Finance Administrator', 'tirelo-finance-admin', 'TIRELO_CAPITAL', 'Manage financing accounts, repayments and collections.'),
(9, 'Super Administrator', 'super-admin', 'TT_UNIK', 'Manage system users, roles, permissions and high-level settings.');

INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order) VALUES
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

INSERT OR IGNORE INTO brands (id, name, slug, is_popular) VALUES
(1, 'Apple', 'apple', 1),
(2, 'Samsung', 'samsung', 1),
(3, 'Dell', 'dell', 1),
(4, 'HP', 'hp', 1),
(5, 'Lenovo', 'lenovo', 1),
(6, 'ASUS', 'asus', 0),
(7, 'TP-Link', 'tp-link', 0);

INSERT OR IGNORE INTO products (id, category_id, brand_id, name, slug, model_number, sku, description, retail_price, cost_price, is_credit_eligible, min_deposit_percentage, warranty_info, status, is_featured) VALUES
(1, 1, 2, 'Samsung Galaxy S24 FE 5G', 'samsung-galaxy-s24-fe-5g', 'SM-S721B', 'TTU-SAM-S24FE', '6.7-inch Dynamic AMOLED 2X display, Exynos 2400e, 50MP pro-grade camera, Galaxy AI ready.', 12000.00, 9600.00, 1, 25.00, '24 Months Samsung South Africa Warranty', 'PUBLISHED', 1),
(2, 2, 3, 'Dell Latitude 5540 Core i7', 'dell-latitude-5540-core-i7', 'LAT-5540-I7', 'TTU-DEL-5540', '13th Gen Intel Core i7, 16GB DDR4 RAM, 512GB NVMe SSD, FHD IPS Anti-Glare, Windows 11 Pro.', 18500.00, 15200.00, 1, 20.00, '36 Months Dell ProSupport Warranty', 'PUBLISHED', 1),
(3, 1, 1, 'Apple iPhone 15 128GB', 'apple-iphone-15-128gb', 'MTP03ZP/A', 'TTU-APL-IP15', 'Dynamic Island, 48MP Main camera with 2x Telephoto, A16 Bionic chip, USB-C.', 19999.00, 16800.00, 1, 20.00, '12 Months Apple South Africa Warranty', 'PUBLISHED', 1),
(4, 2, 4, 'HP ProBook 450 G10', 'hp-probook-450-g10', '85B72EA', 'TTU-HP-450G10', 'Intel Core i5-1335U, 16GB RAM, 512GB SSD, 15.6-inch FHD, Spill-resistant backlit keyboard.', 14500.00, 11800.00, 1, 20.00, '12 Months HP On-Site Warranty', 'PUBLISHED', 1),
(5, 4, 1, 'Apple iPad Air 11-inch M2', 'apple-ipad-air-11-m2', 'MUWC3HC/A', 'TTU-APL-IPADAIR', 'Liquid Retina display, Apple M2 chip, Touch ID, Wi-Fi 6E.', 13999.00, 11500.00, 1, 20.00, '12 Months Apple Warranty', 'PUBLISHED', 0),
(6, 5, 5, 'Lenovo ThinkPad Universal USB-C Dock', 'lenovo-thinkpad-usb-c-dock', '40AY0090EU', 'TTU-LEN-DOCK', 'Universal USB-C docking station with dual 4K display output and 90W power delivery.', 3200.00, 2450.00, 0, NULL, '12 Months Carry-In Warranty', 'PUBLISHED', 0);

INSERT OR IGNORE INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, 1, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80', 'Samsung Galaxy S24 FE 5G', 1, 1),
(2, 2, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'Dell Latitude 5540 Laptop', 1, 1),
(3, 3, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 'Apple iPhone 15', 1, 1),
(4, 4, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 'HP ProBook 450 G10', 1, 1),
(5, 5, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80', 'Apple iPad Air M2', 1, 1),
(6, 6, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80', 'Lenovo USB-C Dock', 1, 1);

INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, colour, ram_capacity, storage_capacity, price_adjustment) VALUES
(1, 1, 'TTU-SAM-S24FE-128-BLK', '128GB / Graphite', 'Graphite', '8GB', '128GB', 0.00),
(2, 1, 'TTU-SAM-S24FE-256-BLU', '256GB / Blue', 'Blue', '8GB', '256GB', 1500.00),
(3, 2, 'TTU-DEL-5540-16-512', '16GB RAM / 512GB SSD', 'Silver', '16GB', '512GB', 0.00),
(4, 2, 'TTU-DEL-5540-32-1TB', '32GB RAM / 1TB SSD', 'Silver', '32GB', '1TB', 3500.00),
(5, 3, 'TTU-APL-IP15-128-BLK', '128GB / Black', 'Black', '6GB', '128GB', 0.00),
(6, 3, 'TTU-APL-IP15-256-BLU', '256GB / Blue', 'Blue', '6GB', '256GB', 2500.00);

INSERT OR IGNORE INTO product_attributes (id, product_id, attribute_name, attribute_value, sort_order) VALUES
(1, 1, 'Display', '6.7" FHD+ Dynamic AMOLED 2X (120Hz)', 1),
(2, 1, 'Battery', '4,700mAh with 25W Super Fast Charging', 2),
(3, 2, 'Processor', 'Intel Core i7-1365U (10 Cores, up to 5.2 GHz)', 1),
(4, 2, 'Operating System', 'Windows 11 Pro 64-bit', 2),
(5, 3, 'Chipset', 'Apple A16 Bionic (6-core CPU)', 1);

INSERT OR IGNORE INTO inventory (id, product_id, product_variant_id, quantity_available, quantity_reserved, low_stock_threshold) VALUES
(1, 1, 1, 25, 0, 5),
(2, 1, 2, 15, 0, 5),
(3, 2, 3, 12, 0, 3),
(4, 2, 4, 6, 0, 2),
(5, 3, 5, 18, 0, 4),
(6, 3, 6, 10, 0, 3),
(7, 4, NULL, 14, 0, 4),
(8, 5, NULL, 9, 0, 3),
(9, 6, NULL, 40, 0, 10);

INSERT OR IGNORE INTO promotions (id, code, name, discount_type, discount_value, min_order_amount, applies_to_credit, starts_at, expires_at) VALUES
(1, 'UNIK10', 'Welcome 10% Cash Discount', 'PERCENTAGE', 10.00, 2000.00, 0, '2026-01-01 00:00:00', '2027-12-31 23:59:59'),
(2, 'TECH500', 'R500 Off Laptops & Phones', 'FIXED_AMOUNT', 500.00, 8000.00, 1, '2026-01-01 00:00:00', '2027-12-31 23:59:59');

INSERT OR IGNORE INTO system_settings (setting_group, setting_key, setting_value, value_type, is_public) VALUES
('TIRELO_CREDIT', 'default_min_deposit_pct', '20', 'NUMBER', 1),
('TIRELO_CREDIT', 'allowed_deposit_percentages', '[15, 20, 25, 30, 40, 50]', 'JSON', 1),
('TIRELO_CREDIT', 'allowed_repayment_months', '[6, 12, 18, 24, 36]', 'JSON', 1),
('TIRELO_CREDIT', 'annual_interest_rate_pct', '21.5', 'NUMBER', 1),
('TIRELO_CREDIT', 'initiation_fee_zar', '1207.50', 'NUMBER', 1),
('TIRELO_CREDIT', 'monthly_service_fee_zar', '69.00', 'NUMBER', 1),
('TIRELO_CREDIT', 'min_credit_eligible_price_zar', '3500.00', 'NUMBER', 1),
('STORE', 'standard_delivery_fee_zar', '150.00', 'NUMBER', 1),
('STORE', 'free_delivery_threshold_zar', '2500.00', 'NUMBER', 1),
('STORE', 'stock_reservation_minutes', '30', 'NUMBER', 0);