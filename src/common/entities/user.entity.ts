import { UserRole } from '../enums';

/**
 * User entity representing a user in the database
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User without sensitive information
 */
export type SafeUser = Omit<User, 'password_hash'>;

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated user attached to request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
