import { OrderStatus, PrismaClient } from 'prisma/generated/client';
import { MetricsIngestService } from './metrics-ingest.service';

const build = (processedCount: number) => {
	const tx = {
		processedEvent: {
			createMany: jest.fn().mockResolvedValue({ count: processedCount }),
		},
		orderSnapshot: {
			upsert: jest.fn().mockResolvedValue({}),
			updateMany: jest.fn().mockResolvedValue({}),
		},
		registeredUser: { createMany: jest.fn().mockResolvedValue({}) },
	};
	const prisma = {
		$transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
	};
	return {
		tx,
		service: new MetricsIngestService(prisma as unknown as PrismaClient),
	};
};

const uuid = '7d9c8b1e-4f3a-4b6e-9a2d-1c5e8f0a3b7d';

describe('MetricsIngestService', () => {
	it('records a registered user once', async () => {
		const { tx, service } = build(1);
		const occurredAt = new Date('2026-01-01T00:00:00Z');
		await expect(
			service.recordUserRegistered({ eventId: uuid, userId: 9, occurredAt })
		).resolves.toBe(true);
		expect(tx.registeredUser.createMany).toHaveBeenCalledWith({
			data: { userId: 9, registeredAt: occurredAt },
			skipDuplicates: true,
		});
	});

	it('ignores duplicate events', async () => {
		const { tx, service } = build(0);
		await expect(
			service.recordUserRegistered({
				eventId: uuid,
				userId: 9,
				occurredAt: new Date(),
			})
		).resolves.toBe(false);
		expect(tx.registeredUser.createMany).not.toHaveBeenCalled();
	});

	it('upserts the order snapshot and only moves status forward in time', async () => {
		const { tx, service } = build(1);
		const orderDate = new Date('2026-01-02T00:00:00Z');
		await service.recordOrderCreated({
			eventId: uuid,
			orderId: 4,
			userId: 2,
			status: OrderStatus.PENDING,
			totalAmount: '30.00',
			orderDate,
		});
		expect(tx.orderSnapshot.upsert).toHaveBeenCalledTimes(1);
		expect(tx.orderSnapshot.updateMany).toHaveBeenCalledWith({
			where: { orderId: 4, statusAt: { lte: orderDate } },
			data: { status: OrderStatus.PENDING, statusAt: orderDate },
		});
	});
});
