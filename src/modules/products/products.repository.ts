import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Product } from '../../common/entities';

/**
 * Products Repository
 * 
 * Handles all database operations related to products.
 */
@Injectable()
export class ProductsRepository {
  private readonly logger = new Logger(ProductsRepository.name);
  private readonly tableName = 'products';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding product by id: ${error.message}`);
      throw error;
    }

    return data as Product;
  }

  /**
   * Create a new product
   */
  async create(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(productData)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating product: ${error.message}`);
      throw error;
    }

    return data as Product;
  }

  /**
   * Update a product
   */
  async update(
    id: string,
    updateData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<Product> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating product: ${error.message}`);
      throw error;
    }

    return data as Product;
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all products with pagination and filters
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    category?: string;
    is_available?: boolean;
    search?: string;
  }): Promise<{ data: Product[]; total: number }> {
    const { page = 1, limit = 10, category, is_available, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (typeof is_available === 'boolean') {
      query = query.eq('is_available', is_available);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Error fetching products: ${error.message}`);
      throw error;
    }

    return {
      data: data as Product[],
      total: count || 0,
    };
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('category')
      .not('category', 'is', null);

    if (error) {
      this.logger.error(`Error fetching categories: ${error.message}`);
      throw error;
    }

    // Extract unique categories
    const categories = [...new Set(data.map((item: { category: string }) => item.category))];
    return categories.filter(Boolean) as string[];
  }
}
