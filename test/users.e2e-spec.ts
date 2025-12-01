/**
 * Users API E2E Tests
 * 
 * Tests for user endpoints:
 * - GET /users/me
 * - PATCH /users/me
 * - GET /users (admin only)
 */

import { TEST_CONFIG, testState, apiRequest } from './setup';

describe('Users API', () => {
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

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const { status, data } = await apiRequest('/users/me', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('full_name');
      expect(data).toHaveProperty('role');
      expect(data).not.toHaveProperty('password_hash');
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/users/me');

      expect(status).toBe(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update user profile', async () => {
      const { status, data } = await apiRequest('/users/me', {
        method: 'PATCH',
        body: {
          full_name: 'Updated Name',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.full_name).toBe('Updated Name');
    });

    it('should update phone number', async () => {
      const { status, data } = await apiRequest('/users/me', {
        method: 'PATCH',
        body: {
          phone: '+9876543210',
        },
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.phone).toBe('+9876543210');
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/users/me', {
        method: 'PATCH',
        body: { full_name: 'Test' },
      });

      expect(status).toBe(401);
    });

    it('should not allow email update', async () => {
      const { status, data } = await apiRequest('/users/me', {
        method: 'PATCH',
        body: {
          email: 'newemail@example.com',
        },
        token: testState.adminToken,
      });

      // Should either ignore the email field or return an error
      if (status === 200) {
        expect(data.email).not.toBe('newemail@example.com');
      }
    });
  });

  describe('GET /users (admin only)', () => {
    it('should list all users for admin', async () => {
      const { status, data } = await apiRequest('/users', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('email');
        expect(data.data[0]).not.toHaveProperty('password_hash');
      }
    });

    it('should support pagination', async () => {
      const { status, data } = await apiRequest('/users?page=1&limit=5', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(5);
      // meta.page might be number or string depending on implementation
      expect([1, '1']).toContain(data.meta.page);
    });

    it('should filter by role', async () => {
      const { status, data } = await apiRequest('/users?role=customer', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      data.data.forEach((user: any) => {
        expect(user.role).toBe('customer');
      });
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/users');

      expect(status).toBe(401);
    });
  });
});
