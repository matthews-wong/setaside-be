-- =============================================
-- SET ASIDE - COMPLETE SUPABASE SCHEMA
-- =============================================
-- This file contains the complete database schema for the Set Aside application.
-- Run this file in your Supabase SQL editor to create all tables.

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES / ENUMS
-- =============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('customer', 'cashier', 'admin');

-- Order status enum with enforced flow: pending → preparing → ready → picked_up
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'picked_up');

-- =============================================
-- USERS TABLE
-- =============================================
-- Stores all user information including authentication data
-- Password is hashed using bcrypt in the application layer

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups during authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
-- Stores all products available for ordering
-- image_url references files in the 'product-images' Supabase bucket

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category VARCHAR(100),
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for product queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_name ON products(name);

-- =============================================
-- ORDERS TABLE
-- =============================================
-- Stores customer orders
-- Status follows the flow: pending → preparing → ready → picked_up

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes TEXT,
    pickup_time TIMESTAMP WITH TIME ZONE,
    prepared_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order queries
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
-- Stores individual items within an order
-- Links orders to products with quantity and price at time of order

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order items queries
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Prevent duplicate products in the same order (use quantity instead)
CREATE UNIQUE INDEX idx_order_items_unique_product ON order_items(order_id, product_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate order total when order_items change
CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE orders 
        SET total_amount = COALESCE((
            SELECT SUM(subtotal) 
            FROM order_items 
            WHERE order_id = OLD.order_id
        ), 0)
        WHERE id = OLD.order_id;
        RETURN OLD;
    ELSE
        UPDATE orders 
        SET total_amount = COALESCE((
            SELECT SUM(subtotal) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ), 0)
        WHERE id = NEW.order_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate order status transitions
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if status is being changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Define valid transitions: pending → preparing → ready → picked_up
    IF (OLD.status = 'pending' AND NEW.status = 'preparing') OR
       (OLD.status = 'preparing' AND NEW.status = 'ready') OR
       (OLD.status = 'ready' AND NEW.status = 'picked_up') THEN
        RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- Function to extract user_id from JWT claim
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract user_role from JWT claim
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.role', true), '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or cashier
CREATE OR REPLACE FUNCTION auth.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.user_role() IN ('admin', 'cashier');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for order_items
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recalculate order total on order_items changes
CREATE TRIGGER recalculate_order_total_on_insert
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_order_total();

CREATE TRIGGER recalculate_order_total_on_update
    AFTER UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_order_total();

CREATE TRIGGER recalculate_order_total_on_delete
    AFTER DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_order_total();

-- Validate order status transitions
CREATE TRIGGER validate_order_status
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_status_transition();

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

-- Create an admin user (password: admin123)
-- Note: In production, create this user through the API
-- INSERT INTO users (email, password_hash, full_name, role) VALUES
-- ('admin@setaside.com', '$2b$10$...', 'System Admin', 'admin');
