import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '../../common/entities';
import { UserRole } from '../../common/enums';

/**
 * Auth Repository
 * 
 * Handles all database operations related to authentication.
 * Uses Supabase client for database queries.
 */
@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  private readonly tableName = 'users';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      this.logger.error(`Error finding user by email: ${error.message}`);
      throw error;
    }

    return data as User;
  }

  /**
   * Find a user by ID
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
   * Create a new user
   */
  async create(userData: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        email: userData.email.toLowerCase(),
        password_hash: userData.password_hash,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role || UserRole.CUSTOMER,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw error;
    }

    return data as User;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error(`Error checking email existence: ${error.message}`);
      throw error;
    }

    return !!data;
  }
}
