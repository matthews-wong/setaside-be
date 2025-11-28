import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import { User, SafeUser, JwtPayload } from '../../common/entities';
import { UserRole } from '../../common/enums';

/**
 * Auth Service
 * 
 * Handles authentication business logic including:
 * - User registration with password hashing
 * - User login with JWT token generation
 * - Token validation and user extraction
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.authRepository.emailExists(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
  const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10;
  const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);


    // Create user (only allow customer role for self-registration)
    const user = await this.authRepository.create({
      email: registerDto.email,
      password_hash: passwordHash,
      full_name: registerDto.full_name,
      phone: registerDto.phone,
      role: UserRole.CUSTOMER, // Force customer role for self-registration
    });

    this.logger.log(`New user registered: ${user.email}`);

    // Generate token and return response
    return this.generateAuthResponse(user);
  }

  /**
   * Login user and return JWT token
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${user.email}`);

    // Generate token and return response
    return this.generateAuthResponse(user);
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove sensitive data
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Validate user from JWT payload
   */
  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.authRepository.findById(payload.sub);
  }

  /**
   * Generate JWT token and auth response
   */
  private generateAuthResponse(user: User): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.getExpiresInSeconds();

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  /**
   * Calculate token expiration in seconds
   */
  private getExpiresInSeconds(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    
    // Parse time string (e.g., "7d", "24h", "60m")
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      return 604800; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd': return value * 86400;
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's': return value;
      default: return 604800;
    }
  }
}
