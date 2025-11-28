import { OrderStatus } from '../enums';
import { OrderItem } from './order-item.entity';
import { SafeUser } from './user.entity';

/**
 * Order entity representing an order in the database
 */
export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  pickup_time?: string;
  prepared_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Order with related data
 */
export interface OrderWithDetails extends Order {
  customer?: SafeUser;
  items?: OrderItem[];
  preparer?: SafeUser;
}
