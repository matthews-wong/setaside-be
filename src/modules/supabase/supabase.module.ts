import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Supabase Module
 * 
 * Global module that provides Supabase client access throughout the application.
 * The service is marked as global so it can be injected anywhere without importing the module.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
