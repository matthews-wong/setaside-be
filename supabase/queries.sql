-- =============================================
-- SET ASIDE - SQL QUERIES REFERENCE
-- =============================================
-- This file contains all SQL queries used in the backend.
-- These queries are executed through Supabase client in the repositories.

-- =============================================
-- USERS QUERIES
-- =============================================

-- Find user by email (for login)
-- Repository: AuthRepository.findByEmail()
SELECT * FROM users WHERE email = 'user@example.com';

-- Find user by ID
-- Repository: AuthRepository.findById(), UsersRepository.findById()
SELECT * FROM users WHERE id = 'uuid-here';

-- Find user by ID (safe, without password)
-- Repository: UsersRepository.findByIdSafe()
SELECT id, email, full_name, phone, role, is_active, created_at, updated_at
FROM users WHERE id = 'uuid-here';

-- Create new user
-- Repository: AuthRepository.create()
INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
VALUES ('user@example.com', 'hashed_password', 'John Doe', '+1234567890', 'customer', true)
RETURNING *;

-- Check if email exists
-- Repository: AuthRepository.emailExists()
SELECT id FROM users WHERE email = 'user@example.com';

-- Update user
-- Repository: UsersRepository.update()
UPDATE users
SET full_name = 'New Name', phone = '+0987654321'
WHERE id = 'uuid-here'
RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at;

-- List all users with pagination and filters
-- Repository: UsersRepository.findAll()
SELECT id, email, full_name, phone, role, is_active, created_at, updated_at
FROM users
WHERE role = 'customer'  -- optional filter
  AND (full_name ILIKE '%search%' OR email ILIKE '%search%')  -- optional search
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- Count users for pagination
SELECT COUNT(*) FROM users
WHERE role = 'customer';

-- =============================================
-- PRODUCTS QUERIES
-- =============================================

-- Find product by ID
-- Repository: ProductsRepository.findById()
SELECT * FROM products WHERE id = 'uuid-here';

-- Create product
-- Repository: ProductsRepository.create()
INSERT INTO products (name, description, price, image_url, category, is_available, stock_quantity, created_by)
VALUES ('Cappuccino', 'A classic coffee', 4.99, NULL, 'Beverages', true, 100, 'user-uuid')
RETURNING *;

-- Update product
-- Repository: ProductsRepository.update()
UPDATE products
SET name = 'New Name', price = 5.99
WHERE id = 'uuid-here'
RETURNING *;

-- Delete product
-- Repository: ProductsRepository.delete()
DELETE FROM products WHERE id = 'uuid-here';

-- List products with pagination and filters
-- Repository: ProductsRepository.findAll()
SELECT * FROM products
WHERE category = 'Beverages'  -- optional filter
  AND is_available = true  -- optional filter
  AND name ILIKE '%coffee%'  -- optional search
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- Get all categories
-- Repository: ProductsRepository.getCategories()
SELECT DISTINCT category FROM products WHERE category IS NOT NULL;

-- =============================================
-- ORDERS QUERIES
-- =============================================

-- Find order by ID
-- Repository: OrdersRepository.findById()
SELECT * FROM orders WHERE id = 'uuid-here';

-- Find order with details (customer, items, products)
-- Repository: OrdersRepository.findByIdWithDetails()
SELECT 
  orders.*,
  json_build_object(
    'id', u.id,
    'email', u.email,
    'full_name', u.full_name,
    'phone', u.phone,
    'role', u.role
  ) as customer,
  (
    SELECT json_agg(
      json_build_object(
        'id', oi.id,
        'order_id', oi.order_id,
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal,
        'special_instructions', oi.special_instructions,
        'product', json_build_object(
          'id', p.id,
          'name', p.name,
          'price', p.price,
          'image_url', p.image_url
        )
      )
    )
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id
  ) as items
FROM orders
JOIN users u ON orders.customer_id = u.id
WHERE orders.id = 'uuid-here';

-- Supabase client equivalent (used in repository):
-- supabase.from('orders').select(`
--   *,
--   customer:users!customer_id(id, email, full_name, phone, role),
--   items:order_items(
--     *,
--     product:products(*)
--   ),
--   preparer:users!prepared_by(id, email, full_name)
-- `).eq('id', orderId).single()

-- Create order
-- Repository: OrdersRepository.create()
INSERT INTO orders (customer_id, notes, pickup_time, status, total_amount)
VALUES ('user-uuid', 'Notes here', '2024-01-15T14:30:00Z', 'pending', 0)
RETURNING *;

-- Update order
-- Repository: OrdersRepository.update()
UPDATE orders
SET notes = 'Updated notes', pickup_time = '2024-01-15T15:00:00Z'
WHERE id = 'uuid-here'
RETURNING *;

-- Update order status
-- Repository: OrdersRepository.updateStatus()
UPDATE orders
SET status = 'preparing', prepared_by = 'cashier-uuid'
WHERE id = 'uuid-here'
RETURNING *;

-- Delete order
-- Repository: OrdersRepository.delete()
DELETE FROM orders WHERE id = 'uuid-here';

-- List all orders with pagination (for staff)
-- Repository: OrdersRepository.findAll()
SELECT 
  orders.*,
  json_build_object(
    'id', u.id,
    'email', u.email,
    'full_name', u.full_name,
    'phone', u.phone
  ) as customer,
  (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as item_count
FROM orders
JOIN users u ON orders.customer_id = u.id
WHERE orders.status = 'pending'  -- optional filter
ORDER BY orders.created_at DESC
LIMIT 10 OFFSET 0;

-- Find orders by customer ID (for customers viewing own orders)
-- Repository: OrdersRepository.findByCustomerId()
SELECT 
  orders.*,
  (
    SELECT json_agg(
      json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal,
        'product', json_build_object(
          'id', p.id,
          'name', p.name,
          'price', p.price,
          'image_url', p.image_url
        )
      )
    )
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id
  ) as items
FROM orders
WHERE orders.customer_id = 'customer-uuid'
  AND orders.status = 'pending'  -- optional filter
ORDER BY orders.created_at DESC
LIMIT 10 OFFSET 0;

-- =============================================
-- ORDER ITEMS QUERIES
-- =============================================

-- Find order item by ID
-- Repository: OrderItemsRepository.findById()
SELECT * FROM order_items WHERE id = 'uuid-here';

-- Find order item with product
-- Repository: OrderItemsRepository.findByIdWithProduct()
SELECT 
  oi.*,
  json_build_object(
    'id', p.id,
    'name', p.name,
    'description', p.description,
    'price', p.price,
    'image_url', p.image_url,
    'category', p.category
  ) as product
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.id = 'uuid-here';

-- Find order items by order ID
-- Repository: OrderItemsRepository.findByOrderId()
SELECT 
  oi.*,
  json_build_object(
    'id', p.id,
    'name', p.name,
    'price', p.price,
    'image_url', p.image_url
  ) as product
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 'order-uuid'
ORDER BY oi.created_at ASC;

-- Create order item
-- Repository: OrderItemsRepository.create()
INSERT INTO order_items (order_id, product_id, quantity, unit_price, special_instructions)
VALUES ('order-uuid', 'product-uuid', 2, 4.99, 'No sugar')
RETURNING *;

-- Update order item
-- Repository: OrderItemsRepository.update()
UPDATE order_items
SET quantity = 3, special_instructions = 'Extra hot'
WHERE id = 'uuid-here'
RETURNING *;

-- Delete order item
-- Repository: OrderItemsRepository.delete()
DELETE FROM order_items WHERE id = 'uuid-here';

-- Find order item by order and product (to check for duplicates)
-- Repository: OrderItemsRepository.findByOrderAndProduct()
SELECT * FROM order_items
WHERE order_id = 'order-uuid' AND product_id = 'product-uuid';

-- =============================================
-- AGGREGATE QUERIES
-- =============================================

-- Calculate order total (automatically done by trigger)
SELECT SUM(subtotal) as total FROM order_items WHERE order_id = 'order-uuid';

-- Get order statistics (for admin dashboard - example)
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;

-- Get popular products (example)
SELECT 
  p.id,
  p.name,
  SUM(oi.quantity) as total_ordered
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_ordered DESC
LIMIT 10;

-- =============================================
-- STORAGE QUERIES (Supabase Storage API)
-- =============================================

-- These are not SQL queries but Supabase Storage API calls:

-- Upload file to bucket:
-- supabase.storage.from('product-images').upload(fileName, fileBuffer, { contentType, upsert: true })

-- Get public URL:
-- supabase.storage.from('product-images').getPublicUrl(fileName)

-- Delete file:
-- supabase.storage.from('product-images').remove([fileName])

-- List files in bucket:
-- supabase.storage.from('product-images').list()
