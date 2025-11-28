import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OrderItem, OrderItemWithProduct } from '../../common/entities';

/**
 * Order Items Repository
 * 
 * Handles all database operations related to order items.
 */
@Injectable()
export class OrderItemsRepository {
  private readonly logger = new Logger(OrderItemsRepository.name);
  private readonly tableName = 'order_items';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find order item by ID
   */
  async findById(id: string): Promise<OrderItem | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding order item: ${error.message}`);
      throw error;
    }

    return data as OrderItem;
  }

  /**
   * Find order item by ID with product details
   */
  async findByIdWithProduct(id: string): Promise<OrderItemWithProduct | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        product:products(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding order item with product: ${error.message}`);
      throw error;
    }

    return data as OrderItemWithProduct;
  }

  /**
   * Find order items by order ID
   */
  async findByOrderId(orderId: string): Promise<OrderItemWithProduct[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        product:products(*)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Error finding order items: ${error.message}`);
      throw error;
    }

    return data as OrderItemWithProduct[];
  }

  /**
   * Create a new order item
   */
  async create(itemData: {
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    special_instructions?: string;
  }): Promise<OrderItem> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(itemData)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating order item: ${error.message}`);
      throw error;
    }

    return data as OrderItem;
  }

  /**
   * Update order item
   */
  async update(
    id: string,
    updateData: Partial<Pick<OrderItem, 'quantity' | 'special_instructions'>>,
  ): Promise<OrderItem> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating order item: ${error.message}`);
      throw error;
    }

    return data as OrderItem;
  }

  /**
   * Delete order item
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting order item: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if product already exists in order
   */
  async findByOrderAndProduct(
    orderId: string,
    productId: string,
  ): Promise<OrderItem | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding order item: ${error.message}`);
      throw error;
    }

    return data as OrderItem;
  }
}
