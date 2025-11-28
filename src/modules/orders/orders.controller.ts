import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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

import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  ListOrdersQueryDto,
} from './dto';
import { CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/entities';
import { Order, OrderWithDetails } from '../../common/entities';

/**
 * Orders Controller
 * 
 * Handles order management endpoints:
 * - POST /orders - Create order
 * - GET /orders - List orders (customer sees own, staff sees all)
 * - GET /orders/:id - Get order details
 * - PATCH /orders/:id - Update order
 * - PATCH /orders/:id/status - Update order status
 * - DELETE /orders/:id - Delete order (only pending)
 */
@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createDto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderWithDetails> {
    return this.ordersService.create(createDto, user);
  }

  /**
   * Get all orders
   */
  @Get()
  @ApiOperation({ summary: 'Get all orders (customer sees own, staff sees all)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders retrieved successfully',
  })
  async findAll(
    @Query() query: ListOrdersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findAll(query, user);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderWithDetails> {
    return this.ordersService.findById(id, user);
  }

  /**
   * Update order
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update order (notes, pickup_time)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Only pending orders can be updated',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.ordersService.update(id, updateDto, user);
  }

  /**
   * Update order status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (cashier/admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only staff can update order status',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, updateDto, user);
  }

  /**
   * Delete order (only pending)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order (only pending orders)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Order deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Only pending orders can be deleted',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.ordersService.delete(id, user);
  }
}
