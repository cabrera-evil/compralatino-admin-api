import { PERMISSION_KEY } from '@/decorators/auth.decorator';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
	let users: { hasPermission: jest.Mock };
	let reflector: Reflector;
	let guard: PermissionGuard;

	const ctx = (user?: any) =>
		({
			getHandler: () => ({}),
			getClass: () => ({}),
			switchToHttp: () => ({ getRequest: () => ({ user }) }),
		}) as any;

	beforeEach(() => {
		users = { hasPermission: jest.fn() };
		reflector = new Reflector();
		jest
			.spyOn(reflector, 'getAllAndOverride')
			.mockImplementation((key) =>
				key === PERMISSION_KEY ? 'monitoring:read' : undefined
			);
		guard = new PermissionGuard(reflector, users as any);
	});

	it('denies when the route declares no permission (fail closed)', async () => {
		jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
		await expect(guard.canActivate(ctx({ id: 1 }))).rejects.toThrow(
			ForbiddenException
		);
		expect(users.hasPermission).not.toHaveBeenCalled();
	});

	it('denies when there is no authenticated user', async () => {
		await expect(guard.canActivate(ctx(undefined))).rejects.toThrow(
			new ForbiddenException('ADMIN_REQUIRED')
		);
		expect(users.hasPermission).not.toHaveBeenCalled();
	});

	it('denies when the user lacks the permission', async () => {
		users.hasPermission.mockResolvedValue(false);
		await expect(guard.canActivate(ctx({ id: 1 }))).rejects.toThrow(
			ForbiddenException
		);
		expect(users.hasPermission).toHaveBeenCalledWith(1, 'monitoring:read');
	});

	it('allows when the user holds the permission', async () => {
		users.hasPermission.mockResolvedValue(true);
		await expect(guard.canActivate(ctx({ id: 1 }))).resolves.toBe(true);
	});

	it('propagates users-api failures (fail closed, no allow)', async () => {
		users.hasPermission.mockRejectedValue(new Error('USERS_UNAVAILABLE'));
		await expect(guard.canActivate(ctx({ id: 1 }))).rejects.toThrow(
			'USERS_UNAVAILABLE'
		);
	});
});
