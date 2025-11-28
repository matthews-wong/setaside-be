import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderItemsModule } from '../order-items/order-items.module';

/**
 * Orders Module
 * 
 * Handles order management including:
 * - Create order
 * - List orders
 * - Get order details
 * - Update order status
 * - Delete order (only pending)
 */
@Module({
  imports: [forwardRef(() => OrderItemsModule)],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
