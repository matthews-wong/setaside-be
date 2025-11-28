import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

/**
 * Products Module
 * 
 * Handles product management including:
 * - List all products
 * - Get product details
 * - Create product (cashier/admin)
 * - Update product (cashier/admin)
 * - Delete product (cashier/admin)
 */
@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
