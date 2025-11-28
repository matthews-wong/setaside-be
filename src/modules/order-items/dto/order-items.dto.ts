import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for creating an order item
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
 * DTO for updating an order item
 */
export class UpdateOrderItemDto {
  @ApiPropertyOptional({
    example: 3,
    description: 'Updated quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({
    example: 'Extra hot please',
    description: 'Special instructions for this item',
  })
  @IsOptional()
  @IsString()
  special_instructions?: string;
}
