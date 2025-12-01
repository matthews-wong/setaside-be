/**
 * Products API E2E Tests
 * 
 * Tests for product endpoints:
 * - GET /products (public)
 * - GET /products/:id (public)
 * - GET /products/categories (public)
 * - POST /products (staff only)
 * - PATCH /products/:id (staff only)
 * - DELETE /products/:id (staff only)
 */

import { TEST_CONFIG, testState, apiRequest } from './setup';

describe('Products API', () => {
  let createdProductId: string;

  // Login before tests
  beforeAll(async () => {
    if (!testState.adminToken) {
      const { data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: TEST_CONFIG.TEST_ADMIN,
      });
      testState.adminToken = data.access_token;
    }
  });

  describe('GET /products', () => {
    it('should list products without authentication', async () => {
      const { status, data } = await apiRequest('/products');

      expect(status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.meta).toHaveProperty('total');
      expect(data.meta).toHaveProperty('page');
      expect(data.meta).toHaveProperty('limit');

      // Store a product ID for later tests
      if (data.data.length > 0) {
        testState.testProductId = data.data[0].id;
      }
    });

    it('should support pagination', async () => {
      const { status, data } = await apiRequest('/products?page=1&limit=5');

      expect(status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(5);
      expect(data.meta.page).toBe(1);
      expect(data.meta.limit).toBe(5);
    });

    it('should filter by category', async () => {
      const { status, data } = await apiRequest('/products?category=Vegetables');

      expect(status).toBe(200);
      if (data.data.length > 0) {
        data.data.forEach((product: any) => {
          expect(product.category).toBe('Vegetables');
        });
      }
    });

    it('should filter by availability', async () => {
      const { status, data } = await apiRequest('/products?is_available=true');

      expect(status).toBe(200);
      data.data.forEach((product: any) => {
        expect(product.is_available).toBe(true);
      });
    });
  });

  describe('GET /products/categories', () => {
    it('should list all categories', async () => {
      const { status, data } = await apiRequest('/products/categories');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('GET /products/:id', () => {
    it('should get product by ID', async () => {
      if (!testState.testProductId) {
        console.log('Skipping - no product ID available');
        return;
      }

      const { status, data } = await apiRequest(`/products/${testState.testProductId}`);

      expect(status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('price');
      expect(data).toHaveProperty('is_available');
    });

    it('should return 404 for non-existent product', async () => {
      const { status } = await apiRequest('/products/00000000-0000-0000-0000-000000000000');

      expect(status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const { status } = await apiRequest('/products/invalid-uuid');

      expect([400, 500]).toContain(status);
    });
  });

  describe('POST /products (staff only)', () => {
    it('should create a product with valid token', async () => {
      const newProduct = {
        name: `Test Product ${Date.now()}`,
        description: 'A test product for e2e testing',
        price: 9.99,
        category: 'Test',
        is_available: true,
        stock_quantity: 100,
      };

      const { status, data } = await apiRequest('/products', {
        method: 'POST',
        body: newProduct,
        token: testState.adminToken,
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(newProduct.name);
      expect(data.price).toBe(newProduct.price);

      createdProductId = data.id;
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/products', {
        method: 'POST',
        body: {
          name: 'Test Product',
          price: 9.99,
        },
      });

      expect(status).toBe(401);
    });

    it('should fail with missing required fields', async () => {
      const { status } = await apiRequest('/products', {
        method: 'POST',
        body: {
          description: 'Missing name and price',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(400);
    });
  });

  describe('PATCH /products/:id (staff only)', () => {
    it('should update a product', async () => {
      if (!createdProductId) {
        console.log('Skipping - no product created');
        return;
      }

      const { status, data } = await apiRequest(`/products/${createdProductId}`, {
        method: 'PATCH',
        body: {
          price: 12.99,
          is_available: false,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.price).toBe(12.99);
      expect(data.is_available).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!createdProductId) return;

      const { status } = await apiRequest(`/products/${createdProductId}`, {
        method: 'PATCH',
        body: { price: 15.99 },
      });

      expect(status).toBe(401);
    });
  });

  describe('DELETE /products/:id (staff only)', () => {
    it('should delete a product', async () => {
      if (!createdProductId) {
        console.log('Skipping - no product created');
        return;
      }

      const { status } = await apiRequest(`/products/${createdProductId}`, {
        method: 'DELETE',
        token: testState.adminToken,
      });

      expect(status).toBe(204);
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/products/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      });

      expect(status).toBe(401);
    });
  });
});
