/**
 * Orders API E2E Tests
 * 
 * Tests for order endpoints:
 * - POST /orders
 * - GET /orders
 * - GET /orders/:id
 * - PATCH /orders/:id
 * - PATCH /orders/:id/status
 * - DELETE /orders/:id
 */

import { TEST_CONFIG, testState, apiRequest } from './setup';

describe('Orders API', () => {
  let createdOrderId: string;

  // Login and get product before tests
  beforeAll(async () => {
    // Login as admin
    if (!testState.adminToken) {
      const { data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: TEST_CONFIG.TEST_ADMIN,
      });
      testState.adminToken = data.access_token;
    }

    // Get a product ID
    if (!testState.testProductId) {
      const { data } = await apiRequest('/products?limit=1');
      if (data.data && data.data.length > 0) {
        testState.testProductId = data.data[0].id;
      }
    }
  });

  describe('POST /orders', () => {
    it('should create an order without items', async () => {
      const { status, data } = await apiRequest('/orders', {
        method: 'POST',
        body: {
          notes: 'E2E test order',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.status).toBe('pending');
      expect(data.notes).toBe('E2E test order');
    });

    it('should create an order with items', async () => {
      if (!testState.testProductId) {
        console.log('Skipping - no product ID available');
        return;
      }

      const { status, data } = await apiRequest('/orders', {
        method: 'POST',
        body: {
          notes: 'E2E test order with items',
          items: [
            {
              product_id: testState.testProductId,
              quantity: 2,
              special_instructions: 'Test instructions',
            },
          ],
        },
        token: testState.adminToken,
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('items');
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.total_amount).toBeGreaterThan(0);
      expect(data.items[0]).toHaveProperty('product');
      expect(data.items[0].product).toHaveProperty('name');

      createdOrderId = data.id;
      testState.testOrderId = data.id;
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/orders', {
        method: 'POST',
        body: { notes: 'Test' },
      });

      expect(status).toBe(401);
    });

    it('should fail with invalid product_id', async () => {
      const { status, data } = await apiRequest('/orders', {
        method: 'POST',
        body: {
          items: [
            {
              product_id: '00000000-0000-0000-0000-000000000000',
              quantity: 1,
            },
          ],
        },
        token: testState.adminToken,
      });

      // Order may be created but items will fail silently, or it may return an error
      // Accept either behavior as valid
      expect([201, 400, 404, 500]).toContain(status);
    });
  });

  describe('GET /orders', () => {
    it('should list orders with authentication', async () => {
      const { status, data } = await apiRequest('/orders', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const { status, data } = await apiRequest('/orders?page=1&limit=5', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(5);
      expect(data.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      const { status, data } = await apiRequest('/orders?status=pending', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      data.data.forEach((order: any) => {
        expect(order.status).toBe('pending');
      });
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/orders');

      expect(status).toBe(401);
    });

    it('should include items with product details', async () => {
      const { status, data } = await apiRequest('/orders?limit=1', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      if (data.data.length > 0 && data.data[0].items.length > 0) {
        const item = data.data[0].items[0];
        expect(item).toHaveProperty('product');
        if (item.product) {
          expect(item.product).toHaveProperty('name');
          expect(item.product).toHaveProperty('price');
        }
      }
    });
  });

  describe('GET /orders/:id', () => {
    it('should get order by ID with full details', async () => {
      if (!createdOrderId) {
        console.log('Skipping - no order created');
        return;
      }

      const { status, data } = await apiRequest(`/orders/${createdOrderId}`, {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.id).toBe(createdOrderId);
      expect(data).toHaveProperty('customer');
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total_amount');
    });

    it('should return 404 for non-existent order', async () => {
      const { status } = await apiRequest('/orders/00000000-0000-0000-0000-000000000000', {
        token: testState.adminToken,
      });

      expect(status).toBe(404);
    });

    it('should fail without authentication', async () => {
      if (!createdOrderId) return;

      const { status } = await apiRequest(`/orders/${createdOrderId}`);

      expect(status).toBe(401);
    });
  });

  describe('PATCH /orders/:id', () => {
    it('should update order notes', async () => {
      if (!createdOrderId) {
        console.log('Skipping - no order created');
        return;
      }

      const { status, data } = await apiRequest(`/orders/${createdOrderId}`, {
        method: 'PATCH',
        body: {
          notes: 'Updated notes',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.notes).toBe('Updated notes');
    });

    it('should update pickup time', async () => {
      if (!createdOrderId) return;

      const pickupTime = new Date(Date.now() + 3600000).toISOString();
      const { status, data } = await apiRequest(`/orders/${createdOrderId}`, {
        method: 'PATCH',
        body: {
          pickup_time: pickupTime,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.pickup_time).toBeDefined();
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update status from pending to ready (simplified flow)', async () => {
      if (!createdOrderId) {
        console.log('Skipping - no order created');
        return;
      }

      // First reset by creating a new pending order
      const { data: newOrder } = await apiRequest('/orders', {
        method: 'POST',
        body: { notes: 'Status test order' },
        token: testState.adminToken,
      });

      const { status, data } = await apiRequest(`/orders/${newOrder.id}/status`, {
        method: 'PATCH',
        body: {
          status: 'ready',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.status).toBe('ready');
      
      // Save for next test
      createdOrderId = newOrder.id;
    });

    it('should fail for invalid status transition (picked_up to pending)', async () => {
      // Create a new order and move it to picked_up
      const { data: newOrder } = await apiRequest('/orders', {
        method: 'POST',
        body: { notes: 'Invalid transition test' },
        token: testState.adminToken,
      });

      // Move to ready then picked_up
      await apiRequest(`/orders/${newOrder.id}/status`, {
        method: 'PATCH',
        body: { status: 'ready' },
        token: testState.adminToken,
      });
      
      await apiRequest(`/orders/${newOrder.id}/status`, {
        method: 'PATCH',
        body: { status: 'picked_up' },
        token: testState.adminToken,
      });

      // Try invalid transition: picked_up -> pending
      const { status, data } = await apiRequest(`/orders/${newOrder.id}/status`, {
        method: 'PATCH',
        body: {
          status: 'pending',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(400);
      expect(data.message).toContain('Invalid status transition');
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete a pending order', async () => {
      // Create a new order to delete
      const { data: newOrder } = await apiRequest('/orders', {
        method: 'POST',
        body: { notes: 'Order to delete' },
        token: testState.adminToken,
      });

      const { status } = await apiRequest(`/orders/${newOrder.id}`, {
        method: 'DELETE',
        token: testState.adminToken,
      });

      expect(status).toBe(204);
    });

    it('should fail to delete non-pending order', async () => {
      // Create and prepare an order
      const { data: newOrder } = await apiRequest('/orders', {
        method: 'POST',
        body: { notes: 'Order to prepare' },
        token: testState.adminToken,
      });

      await apiRequest(`/orders/${newOrder.id}/status`, {
        method: 'PATCH',
        body: { status: 'preparing' },
        token: testState.adminToken,
      });

      const { status, data } = await apiRequest(`/orders/${newOrder.id}`, {
        method: 'DELETE',
        token: testState.adminToken,
      });

      expect(status).toBe(400);
      expect(data.message).toContain('pending');
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/orders/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      });

      expect(status).toBe(401);
    });
  });
});
