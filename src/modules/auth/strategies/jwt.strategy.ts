import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';
import { JwtPayload, AuthenticatedUser } from '../../../common/entities';

/**
 * JWT Strategy for Passport
 * 
 * Validates JWT tokens and extracts user information.
 * This strategy is used by the JwtAuthGuard.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload and return user object
   * This user object is attached to the request as request.user
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.validateUser(payload);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Return authenticated user (attached to request.user)
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
