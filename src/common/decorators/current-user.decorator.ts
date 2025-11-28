import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../entities/user.entity';

/**
 * Decorator to extract the current authenticated user from the request
 * 
 * Usage:
 * @Get('me')
 * getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 * 
 * Or get a specific property:
 * @Get('me')
 * getProfile(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
