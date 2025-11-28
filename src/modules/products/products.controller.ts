import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ListProductsQueryDto } from './dto';
import { Public, CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../../common/entities';
import { Product } from '../../common/entities';
import { UserRole } from '../../common/enums';

/**
 * Products Controller
 * 
 * Handles product management endpoints:
 * - GET /products - List all products (public)
 * - GET /products/categories - Get all categories (public)
 * - GET /products/:id - Get product details (public)
 * - POST /products - Create product (cashier/admin)
 * - PATCH /products/:id - Update product (cashier/admin)
 * - DELETE /products/:id - Delete product (cashier/admin)
 * - POST /products/:id/image - Upload product image (cashier/admin)
 */
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Get all products
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
  })
  async findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  /**
   * Get all categories
   */
  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  async getCategories(): Promise<string[]> {
    return this.productsService.getCategories();
  }

  /**
   * Get product by ID
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async findById(@Param('id') id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  /**
   * Create a new product (cashier/admin only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product (cashier/admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - cashier/admin only',
  })
  async create(
    @Body() createDto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Product> {
    return this.productsService.create(createDto, user.id);
  }

  /**
   * Update a product (cashier/admin only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product (cashier/admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateDto);
  }

  /**
   * Delete a product (cashier/admin only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product (cashier/admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.productsService.delete(id);
  }

  /**
   * Upload product image (cashier/admin only)
   */
  @Post(':id/image')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload product image (cashier/admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image uploaded successfully',
  })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ image_url: string }> {
    const imageUrl = await this.productsService.uploadImage(id, file);
    return { image_url: imageUrl };
  }
}
