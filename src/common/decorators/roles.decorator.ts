import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route
 * 
 * Usage:
 * @Roles(UserRole.ADMIN, UserRole.CASHIER)
 * @Post('products')
 * create() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
