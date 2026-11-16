PRAGMA foreign_keys = ON;

-- 1. ROLES & 2. PERMISSIONS & 3. USERS
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    organization TEXT NOT NULL CHECK(organization IN ('TT_UNIK', 'TIRELO_CAPITAL', 'CUSTOMER')),
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    module TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile_number TEXT NOT NULL UNIQUE,
    email_verified_at TEXT,
    mobile_verified_at TEXT,
    password TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 4. CUSTOMERS & 5. CUSTOMER_ADDRESSES
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    id_type TEXT NOT NULL DEFAULT 'SA_ID' CHECK(id_type IN ('SA_ID', 'PASSPORT')),
    id_number TEXT NOT NULL UNIQUE,
    date_of_birth TEXT,
    popia_consent_given INTEGER NOT NULL DEFAULT 0,
    popia_consent_at TEXT,
    marketing_consent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    address_type TEXT NOT NULL DEFAULT 'DELIVERY' CHECK(address_type IN ('RESIDENTIAL', 'DELIVERY', 'BILLING')),
    street_address TEXT NOT NULL,
    suburb TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 6. CATEGORIES, 7. BRANDS, 8. PRODUCTS, 9. IMAGES, 10. VARIANTS, 11. ATTRIBUTES, 12. INVENTORY
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_popular INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    brand_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    model_number TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT,
    retail_price REAL NOT NULL,
    cost_price REAL NOT NULL DEFAULT 0,
    is_credit_eligible INTEGER NOT NULL DEFAULT 0,
    min_deposit_percentage REAL,
    min_deposit_amount REAL,
    warranty_info TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'PUBLISHED', 'INACTIVE')),
    is_featured INTEGER NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    variant_name TEXT NOT NULL,
    colour TEXT,
    ram_capacity TEXT,
    storage_capacity TEXT,
    processor TEXT,
    screen_size TEXT,
    price_adjustment REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_variant_id INTEGER,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    warehouse_location TEXT DEFAULT 'MAIN-JHB',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(product_id, product_variant_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- 26. PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    discount_value REAL NOT NULL,
    min_order_amount REAL NOT NULL DEFAULT 0,
    applies_to_credit INTEGER NOT NULL DEFAULT 0,
    starts_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    usage_limit INTEGER,
    times_used INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 13. CARTS & 14. CART_ITEMS
CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    session_token TEXT UNIQUE,
    purchase_mode TEXT NOT NULL DEFAULT 'CASH' CHECK(purchase_mode IN ('CASH', 'CREDIT')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_variant_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    saved_for_later INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- 15. ORDERS, 16. ORDER_ITEMS & 17. PAYMENTS
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    delivery_address_id INTEGER NOT NULL,
    promotion_id INTEGER,
    purchase_type TEXT NOT NULL CHECK(purchase_type IN ('CASH', 'CREDIT')),
    status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    subtotal_amount REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL,
    deposit_required REAL NOT NULL DEFAULT 0,
    financed_amount REAL NOT NULL DEFAULT 0,
    courier_name TEXT,
    tracking_number TEXT,
    stock_reserved_until TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_variant_id INTEGER,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    variant_snapshot TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_reference TEXT NOT NULL UNIQUE,
    order_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    payment_type TEXT NOT NULL CHECK(payment_type IN ('FULL_CASH', 'CREDIT_DEPOSIT', 'REFUND')),
    gateway_provider TEXT NOT NULL,
    gateway_transaction_id TEXT UNIQUE,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ZAR',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED')),
    verified_at TEXT,
    raw_gateway_payload TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 18. CREDIT_APPLICATIONS & 19. CREDIT_DOCUMENTS
CREATE TABLE IF NOT EXISTS credit_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_number TEXT NOT NULL UNIQUE,
    tirelo_external_ref TEXT UNIQUE,
    customer_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    product_retail_price REAL NOT NULL,
    selected_deposit_amount REAL NOT NULL,
    proposed_financed_amount REAL NOT NULL,
    repayment_months INTEGER NOT NULL DEFAULT 12,
    estimated_monthly_instalment REAL NOT NULL,
    interest_rate_annual REAL NOT NULL DEFAULT 0,
    initiation_fee REAL NOT NULL DEFAULT 0,
    monthly_service_fee REAL NOT NULL DEFAULT 0,
    employment_status TEXT NOT NULL,
    employer_name TEXT,
    employer_contact TEXT,
    monthly_gross_income REAL NOT NULL,
    monthly_net_income REAL NOT NULL,
    monthly_expenses REAL NOT NULL,
    assessed_by_user_id INTEGER,
    decision_reason TEXT,
    submitted_at TEXT,
    decided_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (assessed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS credit_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_application_id INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    encrypted_storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    reviewer_notes TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id) ON DELETE CASCADE
);

-- 20. CREDIT_ACCOUNTS, 21. CREDIT_AGREEMENTS, 22. REPAYMENT_SCHEDULES, 23. REPAYMENTS, 24. COLLECTIONS
CREATE TABLE IF NOT EXISTS credit_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_number TEXT NOT NULL UNIQUE,
    tirelo_account_ref TEXT UNIQUE,
    customer_id INTEGER NOT NULL,
    credit_application_id INTEGER NOT NULL UNIQUE,
    order_id INTEGER NOT NULL UNIQUE,
    principal_financed REAL NOT NULL,
    total_interest_and_fees REAL NOT NULL,
    total_payable REAL NOT NULL,
    outstanding_balance REAL NOT NULL,
    monthly_instalment REAL NOT NULL,
    term_months INTEGER NOT NULL,
    next_payment_date TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_ACTIVATION',
    activated_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS credit_agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agreement_number TEXT NOT NULL UNIQUE,
    credit_application_id INTEGER NOT NULL UNIQUE,
    credit_account_id INTEGER UNIQUE,
    document_pdf_path TEXT NOT NULL,
    terms_version TEXT NOT NULL,
    accepted_by_customer INTEGER NOT NULL DEFAULT 0,
    accepted_at TEXT,
    acceptance_ip_address TEXT,
    acceptance_otp_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (credit_application_id) REFERENCES credit_applications(id),
    FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id)
);

CREATE TABLE IF NOT EXISTS repayment_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_account_id INTEGER NOT NULL,
    instalment_number INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    principal_component REAL NOT NULL,
    interest_component REAL NOT NULL,
    fee_component REAL NOT NULL,
    total_instalment_due REAL NOT NULL,
    amount_paid REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'UPCOMING',
    paid_at TEXT,
    UNIQUE(credit_account_id, instalment_number),
    FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repayments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repayment_reference TEXT NOT NULL UNIQUE,
    credit_account_id INTEGER NOT NULL,
    repayment_schedule_id INTEGER,
    payment_channel TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    recorded_by_user_id INTEGER,
    external_receipt_ref TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id),
    FOREIGN KEY (repayment_schedule_id) REFERENCES repayment_schedules(id),
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_account_id INTEGER NOT NULL,
    assigned_officer_id INTEGER,
    days_overdue INTEGER NOT NULL DEFAULT 0,
    overdue_amount REAL NOT NULL,
    action_type TEXT NOT NULL,
    notes TEXT NOT NULL,
    promise_to_pay_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (credit_account_id) REFERENCES credit_accounts(id),
    FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
);

-- 25. NOTIFICATIONS, 27. AUDIT_LOGS & 28. SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'PENDING',
    read_at TEXT,
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_group TEXT NOT NULL,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    value_type TEXT NOT NULL DEFAULT 'STRING',
    is_public INTEGER NOT NULL DEFAULT 0,
    updated_by_user_id INTEGER,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);