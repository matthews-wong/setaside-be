import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsRepository } from './products.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto, UpdateProductDto, ListProductsQueryDto } from './dto';
import { Product } from '../../common/entities';

/**
 * Products Service
 * 
 * Handles product-related business logic.
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly bucketName: string;

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('STORAGE_BUCKET_NAME', 'product-images');
  }

  /**
   * Get all products
   */
  async findAll(query: ListProductsQueryDto): Promise<{
    data: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { data, total } = await this.productsRepository.findAll({
      page: query.page,
      limit: query.limit,
      category: query.category,
      is_available: query.is_available,
      search: query.search,
    });

    return {
      data,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  /**
   * Get product by ID
   */
  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Create a new product
   */
  async create(createDto: CreateProductDto, userId: string): Promise<Product> {
    const product = await this.productsRepository.create({
      name: createDto.name,
      description: createDto.description,
      price: createDto.price,
      image_url: createDto.image_url,
      category: createDto.category,
      is_available: createDto.is_available ?? true,
      stock_quantity: createDto.stock_quantity ?? 0,
      created_by: userId,
    });

    this.logger.log(`Product created: ${product.id} by user ${userId}`);
    return product;
  }

  /**
   * Update a product
   */
  async update(id: string, updateDto: UpdateProductDto): Promise<Product> {
    const existingProduct = await this.productsRepository.findById(id);

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.productsRepository.update(id, updateDto);
    this.logger.log(`Product updated: ${id}`);

    return product;
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If product has an image, delete it from storage
    if (product.image_url) {
      await this.deleteProductImage(product.image_url);
    }

    await this.productsRepository.delete(id);
    this.logger.log(`Product deleted: ${id}`);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    return this.productsRepository.getCategories();
  }

  /**
   * Upload product image
   */
  async uploadImage(
    productId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete old image if exists
    if (product.image_url) {
      await this.deleteProductImage(product.image_url);
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase storage
    const { data, error } = await this.supabase
      .getBucket(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading image: ${error.message}`);
      throw new BadRequestException('Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = this.supabase
      .getBucket(this.bucketName)
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Update product with image URL
    await this.productsRepository.update(productId, { image_url: imageUrl });

    this.logger.log(`Image uploaded for product: ${productId}`);
    return imageUrl;
  }

  /**
   * Delete product image from storage
   */
  private async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await this.supabase.getBucket(this.bucketName).remove([fileName]);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete image: ${imageUrl}`);
    }
  }
}
