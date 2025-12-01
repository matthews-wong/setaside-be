/**
 * Auth API E2E Tests
 * 
 * Tests for authentication endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - GET /auth/me
 */

import { TEST_CONFIG, testState, apiRequest } from './setup';

describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const { status, data } = await apiRequest('/auth/register', {
        method: 'POST',
        body: TEST_CONFIG.TEST_CUSTOMER,
      });

      // May be 201 (created) or 409 (already exists)
      if (status === 201) {
        expect(data).toHaveProperty('access_token');
        expect(data).toHaveProperty('user');
        expect(data.user.email).toBe(TEST_CONFIG.TEST_CUSTOMER.email);
        expect(data.user.role).toBe('customer');
        testState.customerToken = data.access_token;
        testState.testUserId = data.user.id;
      } else if (status === 409) {
        expect(data.message).toContain('already registered');
      }
    });

    it('should fail with invalid email', async () => {
      const { status, data } = await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'TestPass123!',
          full_name: 'Test User',
        },
      });

      expect(status).toBe(400);
      expect(data.message).toBeDefined();
    });

    it('should fail with weak password', async () => {
      const { status, data } = await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'weak',
          full_name: 'Test User',
        },
      });

      expect(status).toBe(400);
    });

    it('should fail with missing required fields', async () => {
      const { status } = await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          email: 'test@example.com',
        },
      });

      expect(status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const { status, data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: TEST_CONFIG.TEST_ADMIN,
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('user');
      expect(data.token_type).toBe('Bearer');
      
      testState.adminToken = data.access_token;
    });

    it('should fail with invalid password', async () => {
      const { status, data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          email: TEST_CONFIG.TEST_ADMIN.email,
          password: 'WrongPassword123!',
        },
      });

      expect(status).toBe(401);
      expect(data.message).toContain('Invalid');
    });

    it('should fail with non-existent email', async () => {
      const { status, data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        },
      });

      expect(status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      const { status, data } = await apiRequest('/auth/me', {
        token: testState.adminToken,
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('full_name');
      expect(data).toHaveProperty('role');
    });

    it('should fail without authentication', async () => {
      const { status } = await apiRequest('/auth/me');

      expect(status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const { status } = await apiRequest('/auth/me', {
        token: 'invalid-token',
      });

      expect(status).toBe(401);
    });
  });
});
