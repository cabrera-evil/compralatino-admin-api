import {
	ORDERS_READ_PERMISSION,
	ORDERS_WRITE_PERMISSION,
} from '@/constants/orders-rpc';
import { PERMISSION_KEY } from '@/decorators/auth.decorator';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersClientService } from './orders-client.service';

const build = () => {
	const orders = {
		list: jest.fn().mockResolvedValue({ items: [] }),
		get: jest.fn().mockResolvedValue({ id: 1 }),
		updateStatus: jest.fn().mockResolvedValue({ id: 1 }),
	};
	return {
		orders,
		controller: new OrdersAdminController(
			orders as unknown as OrdersClientService
		),
	};
};

const permissionOf = (method: keyof OrdersAdminController) =>
	Reflect.getMetadata(
		PERMISSION_KEY,
		OrdersAdminController.prototype[method]
	) as string;

describe('OrdersAdminController', () => {
	it('delegates list, get and updateStatus to the client', async () => {
		const { controller, orders } = build();
		await controller.list({ page: 2, status: 'pending' });
		await controller.get(1);
		await controller.updateStatus(1, { status: 'confirmed' });
		expect(orders.list).toHaveBeenCalledWith({ page: 2, status: 'pending' });
		expect(orders.get).toHaveBeenCalledWith(1);
		expect(orders.updateStatus).toHaveBeenCalledWith(1, 'confirmed');
	});

	it('requires orders:read for reads and orders:write for PATCH', () => {
		expect(permissionOf('list')).toBe(ORDERS_READ_PERMISSION);
		expect(permissionOf('get')).toBe(ORDERS_READ_PERMISSION);
		expect(permissionOf('updateStatus')).toBe(ORDERS_WRITE_PERMISSION);
	});
});
