/**
 * E2E Test Setup
 * 
 * Configuration for API testing against production
 */

// Increase timeout for API calls
jest.setTimeout(30000);

// Global test configuration
export const TEST_CONFIG = {
  BASE_URL: 'https://setaside.matthewswong.tech/api/v1',
  
  // Test user credentials (will be created during test setup)
  TEST_CUSTOMER: {
    email: `test.customer.${Date.now()}@example.com`,
    password: 'TestPass123!',
    full_name: 'Test Customer',
    phone: '+1234567890',
  },
  
  TEST_ADMIN: {
    email: 'customer1@example.com', // Existing admin user
    password: 'Customer123!',
  },
};

// Store tokens globally for tests
export const testState = {
  customerToken: '',
  adminToken: '',
  testProductId: '',
  testOrderId: '',
  testOrderItemId: '',
  testUserId: '',
};

// Helper to make API requests
export async function apiRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
  } = {},
): Promise<{ status: number; data: any }> {
  const { method = 'GET', body, token } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${TEST_CONFIG.BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  
  return { status: response.status, data };
}
