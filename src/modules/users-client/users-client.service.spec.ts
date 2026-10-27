import { ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NEVER, of, throwError } from 'rxjs';
import { UsersClientService } from './users-client.service';

const build = (send: jest.Mock | null) =>
	new UsersClientService(
		send ? ({ send } as unknown as ClientProxy) : undefined
	);

describe('UsersClientService', () => {
	afterEach(() => {
		delete process.env.PERMISSIONS_CACHE_TTL_MS;
		delete process.env.USERS_RPC_TIMEOUT_MS;
	});

	it('returns true/false from the permission set and sends the pattern', async () => {
		const send = jest
			.fn()
			.mockReturnValue(of({ userId: 1, roles: [], permissions: ['a'] }));
		const svc = build(send);
		await expect(svc.hasPermission(1, 'a')).resolves.toBe(true);
		await expect(svc.hasPermission(1, 'b')).resolves.toBe(false);
		expect(send).toHaveBeenCalledWith('users.permissions.get', { userId: 1 });
	});

	it('caches replies within the TTL and refetches when TTL is 0', async () => {
		const send = jest
			.fn()
			.mockReturnValue(of({ userId: 1, roles: [], permissions: ['a'] }));
		const svc = build(send);
		await svc.hasPermission(1, 'a');
		await svc.hasPermission(1, 'a');
		expect(send).toHaveBeenCalledTimes(1);

		process.env.PERMISSIONS_CACHE_TTL_MS = '0';
		await svc.hasPermission(1, 'a');
		await svc.hasPermission(1, 'a');
		expect(send).toHaveBeenCalledTimes(3);
	});

	it('fails closed with 503 when RabbitMQ is disabled', async () => {
		await expect(build(null).hasPermission(1, 'a')).rejects.toThrow(
			new ServiceUnavailableException('USERS_UNAVAILABLE')
		);
	});

	it('fails closed with 503 when the transport errors', async () => {
		const send = jest.fn().mockReturnValue(throwError(() => new Error('down')));
		await expect(build(send).hasPermission(1, 'a')).rejects.toThrow(
			ServiceUnavailableException
		);
	});

	it('fails closed with 503 on timeout', async () => {
		process.env.USERS_RPC_TIMEOUT_MS = '10';
		const send = jest.fn().mockReturnValue(NEVER);
		await expect(build(send).hasPermission(1, 'a')).rejects.toThrow(
			ServiceUnavailableException
		);
	});

	it.each([
		['wrong user id', { userId: 2, permissions: [] }],
		['non-array permissions', { userId: 1, permissions: 'a' }],
		['non-string permission', { userId: 1, permissions: [1] }],
		['empty reply', undefined],
	])('fails closed with 503 on a malformed reply (%s)', async (_n, reply) => {
		const send = jest.fn().mockReturnValue(of(reply));
		await expect(build(send).hasPermission(1, 'a')).rejects.toThrow(
			ServiceUnavailableException
		);
	});
});
