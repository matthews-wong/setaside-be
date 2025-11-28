import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { User, SafeUser } from '../../common/entities';
import { UserRole } from '../../common/enums';

/**
 * Users Repository
 * 
 * Handles all database operations related to users.
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  private readonly tableName = 'users';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding user by id: ${error.message}`);
      throw error;
    }

    return data as User;
  }

  /**
   * Find user by ID (safe version without password)
   */
  async findByIdSafe(id: string): Promise<SafeUser | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding user by id: ${error.message}`);
      throw error;
    }

    return data as SafeUser;
  }

  /**
   * Update user
   */
  async update(
    id: string,
    updateData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<SafeUser> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
      .single();

    if (error) {
      this.logger.error(`Error updating user: ${error.message}`);
      throw error;
    }

    return data as SafeUser;
  }

  /**
   * Find all users with pagination and filters
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
  }): Promise<{ data: SafeUser[]; total: number }> {
    const { page = 1, limit = 10, role, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from(this.tableName)
      .select('id, email, full_name, phone, role, is_active, created_at, updated_at', {
        count: 'exact',
      });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }

    return {
      data: data as SafeUser[],
      total: count || 0,
    };
  }
}
