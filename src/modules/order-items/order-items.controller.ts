import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { OrderItemsService } from './order-items.service';
import { CreateOrderItemDto, UpdateOrderItemDto } from './dto';
import { CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/entities';
import { OrderItemWithProduct } from '../../common/entities';

/**
 * Order Items Controller
 * 
 * Handles order item management endpoints:
 * - GET /orders/:id/items - Get all items in an order
 * - POST /orders/:id/items - Add item to order
 * - PATCH /orders/:id/items/:itemId - Update order item
 * - DELETE /orders/:id/items/:itemId - Remove order item
 */
@ApiTags('Order Items')
@ApiBearerAuth('JWT-auth')
@Controller('orders/:orderId/items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  /**
   * Get all items in an order
   */
  @Get()
  @ApiOperation({ summary: 'Get all items in an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order items retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async findAll(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderItemWithProduct[]> {
    return this.orderItemsService.findByOrderId(orderId, user);
  }

  /**
   * Add item to order
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to order (only pending orders)' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item added successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or order not pending',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order or product not found',
  })
  async create(
    @Param('orderId') orderId: string,
    @Body() createDto: CreateOrderItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderItemWithProduct> {
    return this.orderItemsService.create(orderId, createDto, user);
  }

  /**
   * Update order item
   */
  @Patch(':itemId')
  @ApiOperation({ summary: 'Update order item (only pending orders)' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiParam({ name: 'itemId', description: 'Order Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or order not pending',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order or item not found',
  })
  async update(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateOrderItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderItemWithProduct> {
    return this.orderItemsService.update(orderId, itemId, updateDto, user);
  }

  /**
   * Remove item from order
   */
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from order (only pending orders)' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiParam({ name: 'itemId', description: 'Order Item ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Item removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Order not pending',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order or item not found',
  })
  async delete(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.orderItemsService.delete(orderId, itemId, user);
  }
}
