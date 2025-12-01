import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Order, OrderWithDetails } from '../../common/entities';
import { OrderStatus } from '../../common/enums';

/**
 * Orders Repository
 * 
 * Handles all database operations related to orders.
 */
@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);
  private readonly tableName = 'orders';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Find order by ID
   */
  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding order by id: ${error.message}`);
      throw error;
    }

    return data as Order;
  }

  /**
   * Find order by ID with details (customer, items, products)
   */
  async findByIdWithDetails(id: string): Promise<OrderWithDetails | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        customer:users!customer_id(id, email, full_name, phone, role),
        items:order_items(
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          special_instructions,
          created_at,
          updated_at,
          product:products!product_id(id, name, description, price, image_url, category)
        ),
        preparer:users!prepared_by(id, email, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error(`Error finding order with details: ${error.message}`);
      throw error;
    }

    return data as OrderWithDetails;
  }

  /**
   * Create a new order
   */
  async create(orderData: {
    customer_id: string;
    notes?: string;
    pickup_time?: string;
  }): Promise<Order> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        customer_id: orderData.customer_id,
        notes: orderData.notes,
        pickup_time: orderData.pickup_time,
        status: OrderStatus.PENDING,
        total_amount: 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      throw error;
    }

    return data as Order;
  }

  /**
   * Update order
   */
  async update(
    id: string,
    updateData: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<Order> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating order: ${error.message}`);
      throw error;
    }

    return data as Order;
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    preparedBy?: string,
  ): Promise<Order> {
    const updateData: Record<string, unknown> = { status };
    
    if (preparedBy) {
      updateData.prepared_by = preparedBy;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating order status: ${error.message}`);
      throw error;
    }

    return data as Order;
  }

  /**
   * Delete order
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all orders with pagination and filters
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    customer_id?: string;
  }): Promise<{ data: OrderWithDetails[]; total: number }> {
    const { page = 1, limit = 10, status, customer_id } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        customer:users!customer_id(id, email, full_name, phone),
        items:order_items(
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          special_instructions,
          created_at,
          updated_at,
          product:products!product_id(id, name, price, image_url, category)
        )
      `,
        { count: 'exact' },
      );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Error fetching orders: ${error.message}`);
      throw error;
    }

    return {
      data: data as OrderWithDetails[],
      total: count || 0,
    };
  }

  /**
   * Find orders by customer ID
   */
  async findByCustomerId(
    customerId: string,
    options: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
    },
  ): Promise<{ data: OrderWithDetails[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        items:order_items(
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          special_instructions,
          created_at,
          updated_at,
          product:products!product_id(id, name, price, image_url, category)
        )
      `,
        { count: 'exact' },
      )
      .eq('customer_id', customerId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Error fetching customer orders: ${error.message}`);
      throw error;
    }

    return {
      data: data as OrderWithDetails[],
      total: count || 0,
    };
  }
}
