import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../common/enums';

/**
 * DTO for order item in create order request
 */
export class CreateOrderItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Product ID',
  })
  @IsUUID()
  product_id: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity',
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    example: 'No sugar please',
    description: 'Special instructions for this item',
  })
  @IsOptional()
  @IsString()
  special_instructions?: string;
}

/**
 * DTO for creating a new order
 */
export class CreateOrderDto {
  @ApiPropertyOptional({
    example: 'Please prepare it quickly',
    description: 'Order notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '2024-01-15T14:30:00Z',
    description: 'Desired pickup time',
  })
  @IsOptional()
  @IsDateString()
  pickup_time?: string;

  @ApiPropertyOptional({
    type: [CreateOrderItemDto],
    description: 'Order items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}

/**
 * DTO for updating order status
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
    description: 'New order status',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status: OrderStatus;
}

/**
 * DTO for updating order details
 */
export class UpdateOrderDto {
  @ApiPropertyOptional({
    example: 'Updated notes',
    description: 'Order notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '2024-01-15T15:00:00Z',
    description: 'Desired pickup time',
  })
  @IsOptional()
  @IsDateString()
  pickup_time?: string;
}

/**
 * DTO for listing orders with filters
 */
export class ListOrdersQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by customer ID (admin/cashier only)',
  })
  @IsOptional()
  @IsUUID()
  customer_id?: string;
}
