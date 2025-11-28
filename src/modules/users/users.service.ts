import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateUserDto, AdminUpdateUserDto, ListUsersQueryDto } from './dto';
import { SafeUser } from '../../common/entities';
import { UserRole } from '../../common/enums';

/**
 * Users Service
 * 
 * Handles user-related business logic.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Get current user profile
   */
  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.usersRepository.findByIdSafe(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update current user profile
   */
  async updateMe(userId: string, updateDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersRepository.findByIdSafe(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.update(userId, updateDto);
    this.logger.log(`User updated: ${userId}`);

    return updatedUser;
  }

  /**
   * Get all users (admin only)
   */
  async findAll(query: ListUsersQueryDto): Promise<{
    data: SafeUser[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { data, total } = await this.usersRepository.findAll({
      page: query.page,
      limit: query.limit,
      role: query.role,
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
   * Get user by ID (admin only)
   */
  async findById(userId: string): Promise<SafeUser> {
    const user = await this.usersRepository.findByIdSafe(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user by ID (admin only)
   */
  async updateById(
    userId: string,
    updateDto: AdminUpdateUserDto,
  ): Promise<SafeUser> {
    const user = await this.usersRepository.findByIdSafe(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.update(userId, updateDto);
    this.logger.log(`User updated by admin: ${userId}`);

    return updatedUser;
  }
}
