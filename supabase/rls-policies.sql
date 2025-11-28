-- =============================================
-- SET ASIDE - ROW LEVEL SECURITY POLICIES
-- =============================================
-- This file contains all RLS policies for the Set Aside application.
-- These policies use custom JWT claims (not Supabase Auth).
-- 
-- JWT Claims expected:
--   - request.jwt.claim.user_id: UUID of the authenticated user
--   - request.jwt.claim.role: user role (customer, cashier, admin)
--
-- Run this file AFTER schema.sql in your Supabase SQL editor.

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================
-- Rules:
-- 1. Users can only read their own profile
-- 2. Users can only update their own profile
-- 3. Admins can read all users
-- 4. No one can delete users (handled in application layer with is_active flag)

-- Users can read their own profile
CREATE POLICY "users_select_own"
ON users FOR SELECT
USING (id = auth.user_id());

-- Admins can read all users
CREATE POLICY "users_select_admin"
ON users FOR SELECT
USING (auth.user_role() = 'admin');

-- Users can update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
USING (id = auth.user_id())
WITH CHECK (id = auth.user_id());

-- Allow insert for registration (no auth required - handled by service account)
CREATE POLICY "users_insert_public"
ON users FOR INSERT
WITH CHECK (true);

-- =============================================
-- PRODUCTS TABLE POLICIES
-- =============================================
-- Rules:
-- 1. Anyone can read products (public)
-- 2. Only cashier/admin can insert products
-- 3. Only cashier/admin can update products
-- 4. Only cashier/admin can delete products

-- Anyone can read products
CREATE POLICY "products_select_public"
ON products FOR SELECT
USING (true);

-- Only cashier/admin can insert products
CREATE POLICY "products_insert_staff"
ON products FOR INSERT
WITH CHECK (auth.is_staff());

-- Only cashier/admin can update products
CREATE POLICY "products_update_staff"
ON products FOR UPDATE
USING (auth.is_staff())
WITH CHECK (auth.is_staff());

-- Only cashier/admin can delete products
CREATE POLICY "products_delete_staff"
ON products FOR DELETE
USING (auth.is_staff());

-- =============================================
-- ORDERS TABLE POLICIES
-- =============================================
-- Rules:
-- 1. Customers can create orders
-- 2. Customers can view only their own orders
-- 3. Cashier/admin can view all orders
-- 4. Customers can update their own pending orders (cancel)
-- 5. Cashier/admin can update any order (status changes)
-- 6. Only pending orders can be deleted by owner

-- Customers can create orders (only for themselves)
CREATE POLICY "orders_insert_customer"
ON orders FOR INSERT
WITH CHECK (customer_id = auth.user_id());

-- Customers can view their own orders
CREATE POLICY "orders_select_own"
ON orders FOR SELECT
USING (customer_id = auth.user_id());

-- Cashier/admin can view all orders
CREATE POLICY "orders_select_staff"
ON orders FOR SELECT
USING (auth.is_staff());

-- Customers can update their own pending orders only
CREATE POLICY "orders_update_own_pending"
ON orders FOR UPDATE
USING (
    customer_id = auth.user_id() 
    AND status = 'pending'
)
WITH CHECK (customer_id = auth.user_id());

-- Cashier/admin can update any order
CREATE POLICY "orders_update_staff"
ON orders FOR UPDATE
USING (auth.is_staff())
WITH CHECK (auth.is_staff());

-- Customers can delete their own pending orders only
CREATE POLICY "orders_delete_own_pending"
ON orders FOR DELETE
USING (
    customer_id = auth.user_id() 
    AND status = 'pending'
);

-- Cashier/admin can delete any order
CREATE POLICY "orders_delete_staff"
ON orders FOR DELETE
USING (auth.is_staff());

-- =============================================
-- ORDER ITEMS TABLE POLICIES
-- =============================================
-- Rules:
-- 1. Customers can view order_items only if the order belongs to them
-- 2. Customers can add order_items only to their own pending orders
-- 3. Customers can update order_items only in their own pending orders
-- 4. Customers can delete order_items only from their own pending orders
-- 5. Cashier/admin can view/update all order_items

-- Helper function to check if order belongs to user and is pending
CREATE OR REPLACE FUNCTION is_own_pending_order(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM orders 
        WHERE id = order_uuid 
        AND customer_id = auth.user_id() 
        AND status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if order belongs to user (any status)
CREATE OR REPLACE FUNCTION is_own_order(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM orders 
        WHERE id = order_uuid 
        AND customer_id = auth.user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customers can view order_items of their own orders
CREATE POLICY "order_items_select_own"
ON order_items FOR SELECT
USING (is_own_order(order_id));

-- Cashier/admin can view all order_items
CREATE POLICY "order_items_select_staff"
ON order_items FOR SELECT
USING (auth.is_staff());

-- Customers can add items to their own pending orders
CREATE POLICY "order_items_insert_own_pending"
ON order_items FOR INSERT
WITH CHECK (is_own_pending_order(order_id));

-- Cashier/admin can add items to any order
CREATE POLICY "order_items_insert_staff"
ON order_items FOR INSERT
WITH CHECK (auth.is_staff());

-- Customers can update items in their own pending orders
CREATE POLICY "order_items_update_own_pending"
ON order_items FOR UPDATE
USING (is_own_pending_order(order_id))
WITH CHECK (is_own_pending_order(order_id));

-- Cashier/admin can update any order_item
CREATE POLICY "order_items_update_staff"
ON order_items FOR UPDATE
USING (auth.is_staff())
WITH CHECK (auth.is_staff());

-- Customers can delete items from their own pending orders
CREATE POLICY "order_items_delete_own_pending"
ON order_items FOR DELETE
USING (is_own_pending_order(order_id));

-- Cashier/admin can delete any order_item
CREATE POLICY "order_items_delete_staff"
ON order_items FOR DELETE
USING (auth.is_staff());

-- =============================================
-- SECURITY NOTES
-- =============================================
-- 
-- 1. The backend uses a service role key which bypasses RLS.
--    RLS primarily protects against direct database access.
--
-- 2. For direct Supabase client access (PostgREST), the JWT must
--    include user_id and role claims in the expected format.
--
-- 3. The auth.user_id() and auth.user_role() functions extract
--    claims from the JWT set by Supabase when using PostgREST.
--
-- 4. Order status transitions are enforced by database trigger,
--    not RLS policies.
--
-- 5. Soft delete is recommended for users (is_active = false)
--    rather than hard delete to maintain referential integrity.
