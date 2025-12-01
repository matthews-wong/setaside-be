import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrderItemsService } from '../order-items/order-items.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  ListOrdersQueryDto,
} from './dto';
import { Order, OrderWithDetails, AuthenticatedUser } from '../../common/entities';
import { OrderStatus, UserRole, isValidStatusTransition } from '../../common/enums';

/**
 * Orders Service
 * 
 * Handles order-related business logic.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(forwardRef(() => OrderItemsService))
    private readonly orderItemsService: OrderItemsService,
  ) {}

  /**
   * Create a new order
   */
  async create(createDto: CreateOrderDto, user: AuthenticatedUser): Promise<OrderWithDetails> {
    // Create the order
    const order = await this.ordersRepository.create({
      customer_id: user.id,
      notes: createDto.notes,
      pickup_time: createDto.pickup_time,
    });

    this.logger.log(`Order created: ${order.id} by user ${user.id}`);

    // Add items if provided (skip validation since we just created this order)
    if (createDto.items && createDto.items.length > 0) {
      for (const item of createDto.items) {
        try {
          await this.orderItemsService.create(order.id, item, user, true);
        } catch (error) {
          this.logger.error(`Failed to add item to order ${order.id}: ${error.message}`);
          // Continue with other items even if one fails
        }
      }
    }

    // Return order with details
    const orderWithDetails = await this.ordersRepository.findByIdWithDetails(order.id);
    return orderWithDetails!;
  }

  /**
   * Get all orders (with role-based filtering)
   */
  async findAll(
    query: ListOrdersQueryDto,
    user: AuthenticatedUser,
  ): Promise<{
    data: OrderWithDetails[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    let result;

    // Customers can only see their own orders
    if (user.role === UserRole.CUSTOMER) {
      result = await this.ordersRepository.findByCustomerId(user.id, {
        page: query.page,
        limit: query.limit,
        status: query.status,
      });
    } else {
      // Cashier/Admin can see all orders
      result = await this.ordersRepository.findAll({
        page: query.page,
        limit: query.limit,
        status: query.status,
        customer_id: query.customer_id,
      });
    }

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(result.total / (query.limit || 10)),
      },
    };
  }

  /**
   * Get order by ID
   */
  async findById(id: string, user: AuthenticatedUser): Promise<OrderWithDetails> {
    const order = await this.ordersRepository.findByIdWithDetails(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Customers can only view their own orders
    if (user.role === UserRole.CUSTOMER && order.customer_id !== user.id) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  /**
   * Update order (only notes and pickup_time, only if pending)
   */
  async update(
    id: string,
    updateDto: UpdateOrderDto,
    user: AuthenticatedUser,
  ): Promise<Order> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership for customers
    if (user.role === UserRole.CUSTOMER && order.customer_id !== user.id) {
      throw new ForbiddenException('You can only update your own orders');
    }

    // Only pending orders can be updated by customers
    if (user.role === UserRole.CUSTOMER && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
    }

    const updatedOrder = await this.ordersRepository.update(id, updateDto);
    this.logger.log(`Order updated: ${id}`);

    return updatedOrder;
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
    user: AuthenticatedUser,
  ): Promise<Order> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    if (!isValidStatusTransition(order.status, updateDto.status)) {
      throw new BadRequestException(
        `Invalid status transition from '${order.status}' to '${updateDto.status}'`,
      );
    }

    // Only cashier/admin can change status (except customer canceling pending)
    if (user.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Only staff can update order status');
    }

    const updatedOrder = await this.ordersRepository.updateStatus(
      id,
      updateDto.status,
      user.id,
    );

    this.logger.log(`Order status updated: ${id} to ${updateDto.status}`);
    return updatedOrder;
  }

  /**
   * Delete order (only if pending)
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership for customers
    if (user.role === UserRole.CUSTOMER && order.customer_id !== user.id) {
      throw new ForbiddenException('You can only delete your own orders');
    }

    // Only pending orders can be deleted
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be deleted');
    }

    await this.ordersRepository.delete(id);
    this.logger.log(`Order deleted: ${id}`);
  }

  /**
   * Check if order exists and belongs to user (or user is staff)
   */
  async validateOrderAccess(
    orderId: string,
    user: AuthenticatedUser,
    requirePending: boolean = false,
  ): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership for customers
    if (user.role === UserRole.CUSTOMER && order.customer_id !== user.id) {
      throw new ForbiddenException('You can only access your own orders');
    }

    // Check if order is pending when required
    if (requirePending && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('This action is only allowed for pending orders');
    }

    return order;
  }
}
