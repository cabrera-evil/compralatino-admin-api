import { PERMISSION_KEY } from '@/decorators/auth.decorator';
import { UsersClientService } from '@/modules/users-client/users-client.service';
import { AuthUser } from '@/types/jwt-payload.type';
import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Runs after JwtAuthGuard: the caller id comes from the token, permissions from users-api. */
@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly users: UsersClientService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const permission = this.reflector.getAllAndOverride<string>(
			PERMISSION_KEY,
			[context.getHandler(), context.getClass()]
		);
		const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
		if (
			!permission ||
			!user ||
			!(await this.users.hasPermission(user.id, permission))
		)
			throw new ForbiddenException('ADMIN_REQUIRED');
		return true;
	}
}
