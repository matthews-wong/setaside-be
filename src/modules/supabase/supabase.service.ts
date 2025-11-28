import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Service
 * 
 * Provides access to Supabase client for database operations and storage.
 * Uses the service role key to bypass RLS for backend operations.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  onModuleInit() {
    this.logger.log('Supabase client initialized successfully');
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get the storage bucket
   */
  getStorage() {
    return this.supabase.storage;
  }

  /**
   * Get a specific storage bucket
   */
  getBucket(bucketName: string) {
    return this.supabase.storage.from(bucketName);
  }

  /**
   * Execute a query on a table
   */
  from(table: string) {
    return this.supabase.from(table);
  }

  /**
   * Execute a raw SQL query using RPC
   */
  async rpc<T>(functionName: string, params?: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
    return this.supabase.rpc(functionName, params) as unknown as Promise<{ data: T | null; error: Error | null }>;
  }
}
