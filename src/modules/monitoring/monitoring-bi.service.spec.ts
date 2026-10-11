import { BadRequestException } from '@nestjs/common';
import { OrdersClientService } from '../orders-admin/orders-client.service';
import { MonitoringBiService } from './monitoring-bi.service';

const analytics = {
	funnel: { placed: 2, confirmed: 1, paid: 1, delivered: 0 },
	topProducts: {
		byUnits: [{ productCode: 'a', title: 'A', units: 3, revenue: '7.5' }],
		byRevenue: [],
	},
	matchSample: [{ orderId: 1, userId: 2, productCodes: ['a'] }],
};
const build = (purchaseMatch = jest.fn()) => {
	const orders = {
		analytics: jest.fn().mockResolvedValue(analytics),
		purchaseMatch,
	};
	return {
		orders,
		service: new MonitoringBiService(orders as unknown as OrdersClientService),
	};
};

describe('MonitoringBiService', () => {
	it('requires a range', async () => {
		await expect(build().service.getBi({})).rejects.toThrow(
			BadRequestException
		);
	});

	it('sends UTC-6 instants to orders-api and shapes money', async () => {
		const { orders, service } = build(
			jest
				.fn()
				.mockResolvedValue({ sampledOrders: 1, matchedOrders: 1, rate: 1 })
		);
		const { data } = await service.getBi({
			from: '2026-01-01',
			to: '2026-01-31',
		});
		expect(orders.analytics).toHaveBeenCalledWith({
			from: '2026-01-01T06:00:00.000Z',
			to: '2026-02-01T05:59:59.999Z',
		});
		expect(data.topProducts.byUnits[0].revenue).toEqual({
			amount: 7.5,
			currency: 'USD',
		});
		expect(data.recommendationMatch).toEqual({
			sampledOrders: 1,
			matchedOrders: 1,
			rate: 1,
		});
		expect(data.funnel).toEqual(analytics.funnel);
	});

	it('degrades purchase-match to null when recommendations fail, zero when no orders', async () => {
		const failing = build(jest.fn().mockRejectedValue(new Error('down')));
		const { data } = await failing.service.getBi({
			from: '2026-01-01',
			to: '2026-01-02',
		});
		expect(data.recommendationMatch).toBeNull();

		const empty = build();
		empty.orders.analytics.mockResolvedValue({ ...analytics, matchSample: [] });
		const res = await empty.service.getBi({
			from: '2026-01-01',
			to: '2026-01-02',
		});
		expect(res.data.recommendationMatch).toEqual({
			sampledOrders: 0,
			matchedOrders: 0,
			rate: 0,
		});
		expect(empty.orders.purchaseMatch).not.toHaveBeenCalled();
	});
});
