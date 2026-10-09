import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PermissionGuard } from '@/guards/permission.guard';
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiServiceUnavailableResponse,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const PERMISSION_KEY = 'requiredPermission';

/** Valid JWT whose user holds `permission` according to users-api (RabbitMQ lookup). */
export const AdminAuth = (permission: string) =>
	applyDecorators(
		SetMetadata(PERMISSION_KEY, permission),
		UseGuards(JwtAuthGuard, PermissionGuard),
		ApiBearerAuth(),
		ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' }),
		ApiForbiddenResponse({ description: 'Permission missing' }),
		ApiServiceUnavailableResponse({ description: 'users-api unreachable' })
	);
