import {
	BadRequestException,
	ConflictException,
	NotFoundException,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NEVER, of, throwError } from 'rxjs';
import { OrdersClientService } from './orders-client.service';

const build = (send: jest.Mock | null) =>
	new OrdersClientService(
		send ? ({ send } as unknown as ClientProxy) : undefined
	);

describe('OrdersClientService', () => {
	afterEach(() => delete process.env.ORDERS_RPC_TIMEOUT_MS);

	it('sends the list pattern and returns the reply', async () => {
		const reply = { items: [], total: 0, page: 1, pageSize: 10 };
		const send = jest.fn().mockReturnValue(of(reply));
		await expect(build(send).list({ status: 'pending' })).resolves.toEqual(
			reply
		);
		expect(send).toHaveBeenCalledWith('orders.admin.list', {
			status: 'pending',
		});
	});

	it('sends get and updateStatus payloads', async () => {
		const send = jest.fn().mockReturnValue(of({ id: 3 }));
		const svc = build(send);
		await svc.get(3);
		await svc.updateStatus(3, 'confirmed');
		expect(send).toHaveBeenNthCalledWith(1, 'orders.admin.get', { id: 3 });
		expect(send).toHaveBeenNthCalledWith(2, 'orders.admin.updateStatus', {
			id: 3,
			status: 'confirmed',
		});
	});

	it.each([
		[400, 'INVALID_ORDER_STATUS_TRANSITION', BadRequestException],
		[404, 'ORDER_NOT_FOUND', NotFoundException],
		[409, 'ORDER_NOT_PENDING', ConflictException],
	])(
		'maps RPC %s to the matching HTTP exception',
		async (statusCode, message, type) => {
			const send = jest
				.fn()
				.mockReturnValue(throwError(() => ({ statusCode, message })));
			const promise = build(send).get(1);
			await expect(promise).rejects.toBeInstanceOf(type);
			await expect(promise).rejects.toMatchObject({ message });
		}
	);

	it('fails closed with 503 on unknown errors', async () => {
		const send = jest
			.fn()
			.mockReturnValue(throwError(() => ({ statusCode: 500, message: 'x' })));
		await expect(build(send).get(1)).rejects.toBeInstanceOf(
			ServiceUnavailableException
		);
	});

	it('fails closed with 503 on timeout', async () => {
		process.env.ORDERS_RPC_TIMEOUT_MS = '10';
		const send = jest.fn().mockReturnValue(NEVER);
		await expect(build(send).get(1)).rejects.toBeInstanceOf(
			ServiceUnavailableException
		);
	});

	it('fails closed with 503 when RabbitMQ is disabled', async () => {
		await expect(build(null).list({})).rejects.toBeInstanceOf(
			ServiceUnavailableException
		);
	});
});
