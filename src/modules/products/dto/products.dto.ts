import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
  MinLength,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new product
 */
export class CreateProductDto {
  @ApiProperty({
    example: 'Cappuccino',
    description: 'Product name',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'A classic Italian coffee drink',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    example: 4.99,
    description: 'Product price',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Product image URL',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    example: 'Beverages',
    description: 'Product category',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Category must not exceed 100 characters' })
  category?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether product is available',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description: 'Stock quantity',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Stock quantity must be greater than or equal to 0' })
  @Type(() => Number)
  stock_quantity?: number;
}

/**
 * DTO for updating a product
 */
export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Cappuccino',
    description: 'Product name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    example: 'A classic Italian coffee drink',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    example: 4.99,
    description: 'Product price',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Product image URL',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    example: 'Beverages',
    description: 'Product category',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Category must not exceed 100 characters' })
  category?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether product is available',
  })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description: 'Stock quantity',
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Stock quantity must be greater than or equal to 0' })
  @Type(() => Number)
  stock_quantity?: number;
}

/**
 * DTO for listing products with filters
 */
export class ListProductsQueryDto {
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
    example: 'Beverages',
    description: 'Filter by category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by availability',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_available?: boolean;

  @ApiPropertyOptional({
    example: 'coffee',
    description: 'Search by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
