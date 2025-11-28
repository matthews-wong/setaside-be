import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUserDto, AdminUpdateUserDto, ListUsersQueryDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { AuthenticatedUser, SafeUser } from '../../common/entities';
import { UserRole } from '../../common/enums';

/**
 * Users Controller
 * 
 * Handles user management endpoints:
 * - GET /users/me - Get current user profile
 * - PATCH /users/me - Update current user profile
 * - GET /users - List all users (admin only)
 * - GET /users/:id - Get user by ID (admin only)
 * - PATCH /users/:id - Update user by ID (admin only)
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<SafeUser> {
    return this.usersService.getMe(user.id);
  }

  /**
   * Update current user profile
   */
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateUserDto,
  ): Promise<SafeUser> {
    return this.usersService.updateMe(user.id, updateDto);
  }

  /**
   * List all users (admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - admin only',
  })
  async findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * Get user by ID (admin only)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findById(@Param('id') id: string): Promise<SafeUser> {
    return this.usersService.findById(id);
  }

  /**
   * Update user by ID (admin only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateById(
    @Param('id') id: string,
    @Body() updateDto: AdminUpdateUserDto,
  ): Promise<SafeUser> {
    return this.usersService.updateById(id, updateDto);
  }
}
