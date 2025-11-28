import { Module, forwardRef } from '@nestjs/common';
import { OrderItemsController } from './order-items.controller';
import { OrderItemsService } from './order-items.service';
import { OrderItemsRepository } from './order-items.repository';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';

/**
 * Order Items Module
 * 
 * Handles order item management including:
 * - Add items to order
 * - Update order items
 * - Remove order items
 */
@Module({
  imports: [
    forwardRef(() => OrdersModule),
    ProductsModule,
  ],
  controllers: [OrderItemsController],
  providers: [OrderItemsService, OrderItemsRepository],
  exports: [OrderItemsService, OrderItemsRepository],
})
export class OrderItemsModule {}
