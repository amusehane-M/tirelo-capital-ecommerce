-- ============================================================================
-- TT UNIK IT SOLUTIONS - E-Commerce & Tirelo Capital Credit Platform
-- MySQL 8.0+ Relational Schema (28 Tables per URS Section 13)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS tt_unik_ecommerce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tt_unik_ecommerce;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. ROLES & 2. PERMISSIONS & 3. USERS (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    organization ENUM('TT_UNIK', 'TIRELO_CAPITAL', 'CUSTOMER') NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    mobile_number VARCHAR(20) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    mobile_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. CUSTOMERS & 5. CUSTOMER_ADDRESSES
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    id_type ENUM('SA_ID', 'PASSPORT') NOT NULL DEFAULT 'SA_ID',
    id_number VARCHAR(50) NOT NULL UNIQUE,
    date_of_birth DATE NULL,
    popia_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    popia_consent_at TIMESTAMP NULL,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customer_addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    address_type ENUM('RESIDENTIAL', 'DELIVERY', 'BILLING') NOT NULL DEFAULT 'DELIVERY',
    street_address VARCHAR(255) NOT NULL,
    suburb VARCHAR(100) NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. CATEGORIES, 7. BRANDS, 8. PRODUCTS, 9. IMAGES, 10. VARIANTS, 11. ATTRIBUTES, 12. INVENTORY
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE brands (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    logo_url VARCHAR(255) NULL,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    brand_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    model_number VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    retail_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_credit_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    min_deposit_percentage DECIMAL(5, 2) NULL COMMENT 'Overrides Tirelo default if set',
    min_deposit_amount DECIMAL(12, 2) NULL,
    warranty_info VARCHAR(255) NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sales_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_search (name, model_number),
    INDEX idx_products_status_credit (status, is_credit_eligible),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_variants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    variant_name VARCHAR(150) NOT NULL COMMENT 'e.g., 256GB / Titanium Black / 16GB RAM',
    colour VARCHAR(50) NULL,
    ram_capacity VARCHAR(50) NULL,
    storage_capacity VARCHAR(50) NULL,
    processor VARCHAR(100) NULL,
    screen_size VARCHAR(50) NULL,
    price_adjustment DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_attributes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_attributes_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventory (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    warehouse_location VARCHAR(100) DEFAULT 'MAIN-JHB',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_inventory_item (product_id, product_variant_id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 26. PROMOTIONS (Created before orders for FK reference)
-- ----------------------------------------------------------------------------
CREATE TABLE promotions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    applies_to_credit BOOLEAN NOT NULL DEFAULT FALSE,
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    usage_limit INT UNSIGNED NULL,
    times_used INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. CARTS & 14. CART_ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NULL,
    session_token VARCHAR(191) NULL UNIQUE,
    purchase_mode ENUM('CASH', 'CREDIT') NOT NULL DEFAULT 'CASH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    saved_for_later BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 15. ORDERS, 16. ORDER_ITEMS & 17. PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    delivery_address_id BIGINT UNSIGNED NOT NULL,
    promotion_id BIGINT UNSIGNED NULL,
    purchase_type ENUM('CASH', 'CREDIT') NOT NULL,
    status ENUM(
        'PENDING_PAYMENT',
        'CREDIT_APPLICATION_PENDING',
        'CREDIT_APPROVED',
        'DEPOSIT_PAID',
        'PROCESSING',
        'AWAITING_STOCK',
        'READY_FOR_DISPATCH',
        'DISPATCHED',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'PENDING_PAYMENT',
    subtotal_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    deposit_required DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    financed_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    courier_name VARCHAR(100) NULL,
    tracking_number VARCHAR(100) NULL,
    stock_reserved_until TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_customer_status (customer_id, status),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_orders_address FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id),
    CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    variant_snapshot VARCHAR(150) NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    order_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    payment_type ENUM('FULL_CASH', 'CREDIT_DEPOSIT', 'REFUND') NOT NULL,
    gateway_provider VARCHAR(100) NOT NULL COMMENT 'e.g., PayFast, Ozow, PeachPayments',
    gateway_transaction_id VARCHAR(191) NULL UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'ZAR',
    status ENUM('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMP NULL,
    raw_gateway_payload JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 18. CREDIT_APPLICATIONS & 19. CREDIT_DOCUMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE credit_applications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    tirelo_external_ref VARCHAR(100) NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    status ENUM(
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'DOCUMENTS_REQUIRED',
        'APPROVED',
        'DECLINED',
        'DEPOSIT_PENDING',
        'AGREEMENT_PENDING',
        'ACTIVE',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',
    product_retail_price DECIMAL(12, 2) NOT NULL,
    selected_deposit_amount DECIMAL(12, 2) NOT NULL,
    proposed_financed_amount DECIMAL(12, 2) NOT NULL,
    repayment_months INT UNSIGNED NOT NULL DEFAULT 12,
    estimated_monthly_instalment DECIMAL(12, 2) NOT NULL,
    interest_rate_annual DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    initiation_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    monthly_service_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    employment_status ENUM('PERMANENT', 'CONTRACT', 'SELF_EMPLOYED', 'UNEMPLOYED', 'PENSIONER') NOT NULL,
    employer_name VARCHAR(150) NULL,
    employer_contact VARCHAR(50) NULL,
    monthly_gross_income DECIMAL(12, 2) NOT NULL,
    monthly_net_income DECIMAL(12, 2) NOT NULL,
    monthly_expenses DECIMAL(12, 2) NOT NULL,
    assessed_by_user_id BIGINT UNSIGNED NULL,
    decision_reason TEXT NULL,
    submitted_at TIMESTAMP NULL,
    decided_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_credit_apps_status (status),
    CONSTRAINT fk_credit_apps_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_credit_apps_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_credit_apps_officer FOREIGN KEY (assessed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE credit_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    credit_application_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM('SA_ID_OR_PASSPORT', 'PROOF_OF_RESIDENCE', 'PAYSLIP', 'BANK_STATEMENT', 'ADDITIONAL_REQUESTED') NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    encrypted_storage_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT UNSIGNED NOT NULL,
    verification_status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewer_notes VARCHAR(255) NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credit_docs_app FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 20. CREDIT_ACCOUNTS, 21. CREDIT_AGREEMENTS, 22. REPAYMENT_SCHEDULES, 23. REPAYMENTS, 24. COLLECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE credit_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    tirelo_account_ref VARCHAR(100) NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    credit_application_id BIGINT UNSIGNED NOT NULL UNIQUE,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    principal_financed DECIMAL(12, 2) NOT NULL,
    total_interest_and_fees DECIMAL(12, 2) NOT NULL,
    total_payable DECIMAL(12, 2) NOT NULL,
    outstanding_balance DECIMAL(12, 2) NOT NULL,
    monthly_instalment DECIMAL(12, 2) NOT NULL,
    term_months INT UNSIGNED NOT NULL,
    next_payment_date DATE NULL,
    status ENUM('PENDING_ACTIVATION', 'ACTIVE', 'ARREARS', 'SETTLED', 'WRITTEN_OFF', 'CANCELLED') NOT NULL DEFAULT 'PENDING_ACTIVATION',
    activated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_credit_acc_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_credit_acc_app FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id),
    CONSTRAINT fk_credit_acc_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE credit_agreements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    agreement_number VARCHAR(50) NOT NULL UNIQUE,
    credit_application_id BIGINT UNSIGNED NOT NULL UNIQUE,
    credit_account_id BIGINT UNSIGNED NULL UNIQUE,
    document_pdf_path VARCHAR(255) NOT NULL,
    terms_version VARCHAR(50) NOT NULL,
    accepted_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at TIMESTAMP NULL,
    acceptance_ip_address VARCHAR(45) NULL,
    acceptance_otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agreements_app FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id),
    CONSTRAINT fk_agreements_account FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id)
) ENGINE=InnoDB;

CREATE TABLE repayment_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    credit_account_id BIGINT UNSIGNED NOT NULL,
    instalment_number INT UNSIGNED NOT NULL,
    due_date DATE NOT NULL,
    principal_component DECIMAL(12, 2) NOT NULL,
    interest_component DECIMAL(12, 2) NOT NULL,
    fee_component DECIMAL(12, 2) NOT NULL,
    total_instalment_due DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('UPCOMING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE') NOT NULL DEFAULT 'UPCOMING',
    paid_at TIMESTAMP NULL,
    UNIQUE KEY uq_schedule_instalment (credit_account_id, instalment_number),
    CONSTRAINT fk_schedules_account FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE repayments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    repayment_reference VARCHAR(100) NOT NULL UNIQUE,
    credit_account_id BIGINT UNSIGNED NOT NULL,
    repayment_schedule_id BIGINT UNSIGNED NULL,
    payment_channel ENUM('DEBIT_ORDER', 'EFT', 'CARD', 'PAYMENT_GATEWAY') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    recorded_by_user_id BIGINT UNSIGNED NULL,
    external_receipt_ref VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repayments_account FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id),
    CONSTRAINT fk_repayments_schedule FOREIGN KEY (repayment_schedule_id) REFERENCES repayment_schedules(id),
    CONSTRAINT fk_repayments_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE collections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    credit_account_id BIGINT UNSIGNED NOT NULL,
    assigned_officer_id BIGINT UNSIGNED NULL,
    days_overdue INT UNSIGNED NOT NULL DEFAULT 0,
    overdue_amount DECIMAL(12, 2) NOT NULL,
    action_type ENUM('SMS_REMINDER', 'EMAIL_REMINDER', 'WHATSAPP_REMINDER', 'PHONE_CALL', 'PROMISE_TO_PAY', 'LEGAL_ESCALATION') NOT NULL,
    notes TEXT NOT NULL,
    promise_to_pay_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collections_account FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id),
    CONSTRAINT fk_collections_officer FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 25. NOTIFICATIONS, 27. AUDIT_LOGS & 28. SYSTEM_SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    channel ENUM('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP') NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    delivery_status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    read_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_group VARCHAR(100) NOT NULL,
    setting_key VARCHAR(150) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    value_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by_user_id BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;