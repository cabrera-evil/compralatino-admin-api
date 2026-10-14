import { OrderStatus, Prisma, PrismaClient } from 'prisma/generated/client';
import { MonitoringService } from './monitoring.service';

const build = (overrides: Record<string, unknown> = {}) => {
	const prisma = {
		orderSnapshot: {
			count: jest.fn().mockResolvedValue(3),
			aggregate: jest.fn().mockResolvedValue({
				_sum: { totalAmount: new Prisma.Decimal('45.50') },
			}),
			groupBy: jest.fn().mockResolvedValue([
				{ status: OrderStatus.PENDING, _count: { _all: 2 } },
				{ status: OrderStatus.CANCELLED, _count: { _all: 1 } },
			]),
			findMany: jest.fn().mockResolvedValue([]),
		},
		registeredUser: { count: jest.fn().mockResolvedValue(7) },
		...overrides,
	};
	return {
		prisma,
		service: new MonitoringService(prisma as unknown as PrismaClient),
	};
};

describe('MonitoringService', () => {
	it('excludes cancelled and failed orders from sales', async () => {
		const { prisma, service } = build();
		await service.getSnapshot({});
		expect(prisma.orderSnapshot.aggregate).toHaveBeenCalledWith({
			_sum: { totalAmount: true },
			where: {
				status: { notIn: [OrderStatus.CANCELLED, OrderStatus.FAILED] },
			},
		});
	});

	it('zero-fills every status and reports counts and new users', async () => {
		const { service } = build();
		const { data, pagination } = await service.getSnapshot({});
		const kpis = JSON.parse(JSON.stringify(data.kpis));
		expect(kpis.newUsers).toBe(7);
		expect(kpis.orderCount).toBe(3);
		expect(kpis.ordersByStatus).toEqual({
			pending: 2,
			confirmed: 0,
			failed: 0,
			cancelled: 1,
		});
		expect(pagination).toBeDefined();
	});

	it('treats a missing sales sum as zero', async () => {
		const { prisma, service } = build();
		prisma.orderSnapshot.aggregate.mockResolvedValue({
			_sum: { totalAmount: null },
		});
		const { data } = await service.getSnapshot({});
		expect(JSON.stringify(data.kpis)).toMatch(/0/);
	});

	it('caps the page size and applies skip', async () => {
		const { prisma, service } = build();
		await service.getSnapshot({ take: 100000, skip: 5 });
		const args = prisma.orderSnapshot.findMany.mock.calls[0][0];
		expect(args.take).toBeLessThan(100000);
		expect(args.skip).toBe(5);
	});

	it('without a range queries all-time (no where on counts)', async () => {
		const { prisma, service } = build();
		await service.getSnapshot({});
		expect(prisma.orderSnapshot.count).toHaveBeenCalledWith({
			where: undefined,
		});
		expect(prisma.registeredUser.count).toHaveBeenCalledWith({
			where: undefined,
		});
	});

	it('scopes KPIs, new users and recent orders to the range', async () => {
		const { prisma, service } = build();
		await service.getSnapshot({ from: '2026-01-01', to: '2026-01-31' });
		const orderDate = {
			gte: new Date('2026-01-01T06:00:00.000Z'),
			lte: new Date('2026-02-01T05:59:59.999Z'),
		};
		expect(prisma.orderSnapshot.count).toHaveBeenCalledWith({
			where: { orderDate },
		});
		expect(prisma.orderSnapshot.aggregate).toHaveBeenCalledWith({
			_sum: { totalAmount: true },
			where: {
				orderDate,
				status: { notIn: [OrderStatus.CANCELLED, OrderStatus.FAILED] },
			},
		});
		expect(prisma.orderSnapshot.groupBy).toHaveBeenCalledWith(
			expect.objectContaining({ where: { orderDate } })
		);
		expect(prisma.registeredUser.count).toHaveBeenCalledWith({
			where: { registeredAt: orderDate },
		});
		expect(prisma.orderSnapshot.findMany.mock.calls[0][0].where).toEqual({
			orderDate,
		});
	});
});
