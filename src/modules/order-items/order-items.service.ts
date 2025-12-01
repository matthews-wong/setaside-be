import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { OrderItemsRepository } from './order-items.repository';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderItemDto, UpdateOrderItemDto } from './dto';
import { OrderItem, OrderItemWithProduct, AuthenticatedUser } from '../../common/entities';

/**
 * Order Items Service
 * 
 * Handles order item-related business logic.
 */
@Injectable()
export class OrderItemsService {
  private readonly logger = new Logger(OrderItemsService.name);

  constructor(
    private readonly orderItemsRepository: OrderItemsRepository,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Get all items for an order
   */
  async findByOrderId(
    orderId: string,
    user: AuthenticatedUser,
  ): Promise<OrderItemWithProduct[]> {
    // Validate order access
    await this.ordersService.validateOrderAccess(orderId, user);

    return this.orderItemsRepository.findByOrderId(orderId);
  }

  /**
   * Add item to order
   */
  async create(
    orderId: string,
    createDto: CreateOrderItemDto,
    user: AuthenticatedUser,
    skipValidation: boolean = false,
  ): Promise<OrderItemWithProduct> {
    // Validate order access and ensure it's pending (skip when called from order creation)
    if (!skipValidation) {
      await this.ordersService.validateOrderAccess(orderId, user, true);
    }

    // Get product to verify it exists and get price
    const product = await this.productsService.findById(createDto.product_id);

    if (!product.is_available) {
      throw new BadRequestException('Product is not available');
    }

    // Check stock (handle null stock_quantity as unlimited)
    const stockQuantity = product.stock_quantity ?? Infinity;
    if (stockQuantity < createDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Check if product already in order
    const existingItem = await this.orderItemsRepository.findByOrderAndProduct(
      orderId,
      createDto.product_id,
    );

    if (existingItem) {
      // Update quantity instead of creating new item
      const newQuantity = existingItem.quantity + createDto.quantity;
      const newSubtotal = newQuantity * existingItem.unit_price;
      
      const updatedItem = await this.orderItemsRepository.update(existingItem.id, {
        quantity: newQuantity,
        subtotal: newSubtotal,
        special_instructions: createDto.special_instructions || existingItem.special_instructions,
      });

      this.logger.log(`Order item quantity updated: ${existingItem.id}`);
      
      return this.orderItemsRepository.findByIdWithProduct(updatedItem.id) as Promise<OrderItemWithProduct>;
    }

    // Create new order item
    const orderItem = await this.orderItemsRepository.create({
      order_id: orderId,
      product_id: createDto.product_id,
      quantity: createDto.quantity,
      unit_price: product.price,
      special_instructions: createDto.special_instructions,
    });

    this.logger.log(`Order item created: ${orderItem.id}`);

    return this.orderItemsRepository.findByIdWithProduct(orderItem.id) as Promise<OrderItemWithProduct>;
  }

  /**
   * Update order item
   */
  async update(
    orderId: string,
    itemId: string,
    updateDto: UpdateOrderItemDto,
    user: AuthenticatedUser,
  ): Promise<OrderItemWithProduct> {
    // Validate order access and ensure it's pending
    await this.ordersService.validateOrderAccess(orderId, user, true);

    // Get order item
    const orderItem = await this.orderItemsRepository.findById(itemId);

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    if (orderItem.order_id !== orderId) {
      throw new BadRequestException('Order item does not belong to this order');
    }

    // Check stock if quantity is being updated
    if (updateDto.quantity) {
      const product = await this.productsService.findById(orderItem.product_id);
      if (product.stock_quantity < updateDto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    // Prepare update data with subtotal if quantity is changing
    const updateData: any = { ...updateDto };
    if (updateDto.quantity) {
      updateData.subtotal = updateDto.quantity * orderItem.unit_price;
    }

    const updatedItem = await this.orderItemsRepository.update(itemId, updateData);
    this.logger.log(`Order item updated: ${itemId}`);

    return this.orderItemsRepository.findByIdWithProduct(updatedItem.id) as Promise<OrderItemWithProduct>;
  }

  /**
   * Remove item from order
   */
  async delete(
    orderId: string,
    itemId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    // Validate order access and ensure it's pending
    await this.ordersService.validateOrderAccess(orderId, user, true);

    // Get order item
    const orderItem = await this.orderItemsRepository.findById(itemId);

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    if (orderItem.order_id !== orderId) {
      throw new BadRequestException('Order item does not belong to this order');
    }

    await this.orderItemsRepository.delete(itemId);
    this.logger.log(`Order item deleted: ${itemId}`);
  }
}
