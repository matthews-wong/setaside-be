import { Product } from './product.entity';

/**
 * Order item entity representing an item in an order
 */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Order item with product details
 */
export interface OrderItemWithProduct extends OrderItem {
  product?: Product;
}
