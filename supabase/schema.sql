-- Supabase PostgreSQL Schema
-- Copy this to Supabase SQL Editor when ready to migrate from SQLite

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'STAFF',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  address TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(255) UNIQUE NOT NULL,
  barcode VARCHAR(255) UNIQUE,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'POS',
  status VARCHAR(50) DEFAULT 'PENDING',
  total_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Row Level Security (RLS) - Enable if needed for multi-tenant
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Sample data for testing
INSERT INTO users (username, password, name, role) VALUES 
  ('admin', '$2a$10$...', 'Admin User', 'OWNER')
ON CONFLICT (username) DO NOTHING;

-- Sample categories
INSERT INTO categories (name, slug) VALUES 
  ('Đồ uống', 'do-uong'),
  ('Đồ ăn', 'do-an'),
  ('Tráng miệng', 'trang-mieng')
ON CONFLICT (name) DO NOTHING;
