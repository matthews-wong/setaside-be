/**
 * Order Items API E2E Tests
 * 
 * Tests for order item endpoints:
 * - GET /orders/:orderId/items
 * - POST /orders/:orderId/items
 * - PATCH /orders/:orderId/items/:itemId
 * - DELETE /orders/:orderId/items/:itemId
 */

import { TEST_CONFIG, testState, apiRequest } from './setup';

describe('Order Items API', () => {
  let testOrderId: string;
  let testItemId: string;

  // Setup: Login and create an order
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

    // Create a test order
    const { data: order } = await apiRequest('/orders', {
      method: 'POST',
      body: { notes: 'Order for item tests' },
      token: testState.adminToken,
    });
    testOrderId = order.id;
  });

  describe('POST /orders/:orderId/items', () => {
    it('should add an item to order', async () => {
      if (!testState.testProductId) {
        console.log('Skipping - no product ID available');
        return;
      }

      const { status, data } = await apiRequest(`/orders/${testOrderId}/items`, {
        method: 'POST',
        body: {
          product_id: testState.testProductId,
          quantity: 2,
          special_instructions: 'Test instruction',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('product');
      expect(data.product).toHaveProperty('name');
      expect(data.quantity).toBe(2);
      expect(data.order_id).toBe(testOrderId);

      testItemId = data.id;
    });

    it('should increase quantity when adding same product', async () => {
      if (!testState.testProductId || !testItemId) {
        console.log('Skipping - no product/item available');
        return;
      }

      const { status, data } = await apiRequest(`/orders/${testOrderId}/items`, {
        method: 'POST',
        body: {
          product_id: testState.testProductId,
          quantity: 1,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(201);
      expect(data.quantity).toBe(3); // 2 + 1
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest(`/orders/${testOrderId}/items`, {
        method: 'POST',
        body: {
          product_id: testState.testProductId,
          quantity: 1,
        },
      });

      expect(status).toBe(401);
    });

    it('should fail with invalid product_id', async () => {
      const { status } = await apiRequest(`/orders/${testOrderId}/items`, {
        method: 'POST',
        body: {
          product_id: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(404);
    });

    it('should fail with quantity less than 1', async () => {
      const { status } = await apiRequest(`/orders/${testOrderId}/items`, {
        method: 'POST',
        body: {
          product_id: testState.testProductId,
          quantity: 0,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(400);
    });
  });

  describe('GET /orders/:orderId/items', () => {
    it('should list all items in order', async () => {
      const { status, data } = await apiRequest(`/orders/${testOrderId}/items`, {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('product');
        expect(data[0]).toHaveProperty('quantity');
        expect(data[0]).toHaveProperty('unit_price');
      }
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest(`/orders/${testOrderId}/items`);

      expect(status).toBe(401);
    });

    it('should return 404 for non-existent order', async () => {
      const { status } = await apiRequest('/orders/00000000-0000-0000-0000-000000000000/items', {
        token: testState.adminToken,
      });

      expect(status).toBe(404);
    });
  });

  describe('PATCH /orders/:orderId/items/:itemId', () => {
    it('should update item quantity', async () => {
      if (!testItemId) {
        console.log('Skipping - no item created');
        return;
      }

      const { status, data } = await apiRequest(`/orders/${testOrderId}/items/${testItemId}`, {
        method: 'PATCH',
        body: {
          quantity: 5,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.quantity).toBe(5);
    });

    it('should update special instructions', async () => {
      if (!testItemId) return;

      const { status, data } = await apiRequest(`/orders/${testOrderId}/items/${testItemId}`, {
        method: 'PATCH',
        body: {
          special_instructions: 'Updated instructions',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.special_instructions).toBe('Updated instructions');
    });

    it('should fail without authentication', async () => {
      if (!testItemId) return;

      const { status } = await apiRequest(`/orders/${testOrderId}/items/${testItemId}`, {
        method: 'PATCH',
        body: { quantity: 10 },
      });

      expect(status).toBe(401);
    });
  });

  describe('DELETE /orders/:orderId/items/:itemId', () => {
    it('should remove item from order', async () => {
      if (!testItemId) {
        console.log('Skipping - no item created');
        return;
      }

      const { status } = await apiRequest(`/orders/${testOrderId}/items/${testItemId}`, {
        method: 'DELETE',
        token: testState.adminToken,
      });

      expect(status).toBe(204);
    });

    it('should return 404 for already deleted item', async () => {
      if (!testItemId) return;

      const { status } = await apiRequest(`/orders/${testOrderId}/items/${testItemId}`, {
        method: 'DELETE',
        token: testState.adminToken,
      });

      expect(status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest(`/orders/${testOrderId}/items/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
      });

      expect(status).toBe(401);
    });
  });

  describe('Non-pending order restrictions', () => {
    let preparingOrderId: string;

    beforeAll(async () => {
      // Create and prepare an order
      const { data: order } = await apiRequest('/orders', {
        method: 'POST',
        body: { notes: 'Order to prepare' },
        token: testState.adminToken,
      });
      preparingOrderId = order.id;

      await apiRequest(`/orders/${preparingOrderId}/status`, {
        method: 'PATCH',
        body: { status: 'preparing' },
        token: testState.adminToken,
      });
    });

    it('should fail to add item to non-pending order', async () => {
      const { status, data } = await apiRequest(`/orders/${preparingOrderId}/items`, {
        method: 'POST',
        body: {
          product_id: testState.testProductId,
          quantity: 1,
        },
        token: testState.adminToken,
      });

      expect(status).toBe(400);
      expect(data.message).toContain('pending');
    });
  });
});
