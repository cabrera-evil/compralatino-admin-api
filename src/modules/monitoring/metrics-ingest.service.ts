import {
	OrderCreatedPayload,
	OrderUpdatedPayload,
	UserRegisteredPayload,
} from '@/modules/events/event-payloads';
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from 'prisma/generated/client';

/** Every method returns false when the event was already processed (no-op). */
@Injectable()
export class MetricsIngestService {
	constructor(private readonly prisma: PrismaClient) {}

	private once(
		eventId: string,
		apply: (tx: Prisma.TransactionClient) => Promise<void>
	): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const { count } = await tx.processedEvent.createMany({
				data: { eventId },
				skipDuplicates: true,
			});
			if (count === 0) return false;
			await apply(tx);
			return true;
		});
	}

	// Status only moves forward in time, so out-of-order delivery converges.
	private moveStatus(
		tx: Prisma.TransactionClient,
		{
			orderId,
			status,
		}: { orderId: number; status: OrderCreatedPayload['status'] },
		at: Date
	) {
		return tx.orderSnapshot.updateMany({
			where: { orderId, statusAt: { lte: at } },
			data: { status, statusAt: at },
		});
	}

	recordOrderCreated(event: OrderCreatedPayload): Promise<boolean> {
		const totalAmount = new Prisma.Decimal(event.totalAmount);
		return this.once(event.eventId, async (tx) => {
			await tx.orderSnapshot.upsert({
				where: { orderId: event.orderId },
				create: {
					orderId: event.orderId,
					userId: event.userId,
					status: event.status,
					statusAt: event.orderDate,
					totalAmount,
					orderDate: event.orderDate,
				},
				update: {
					userId: event.userId,
					totalAmount,
					orderDate: event.orderDate,
				},
			});
			await this.moveStatus(tx, event, event.orderDate);
		});
	}

	recordOrderUpdated(event: OrderUpdatedPayload): Promise<boolean> {
		return this.once(event.eventId, async (tx) => {
			await tx.orderSnapshot.upsert({
				where: { orderId: event.orderId },
				create: {
					orderId: event.orderId,
					userId: event.userId,
					status: event.status,
					statusAt: event.updatedAt,
				},
				update: { userId: event.userId },
			});
			await this.moveStatus(tx, event, event.updatedAt);
		});
	}

	recordUserRegistered(event: UserRegisteredPayload): Promise<boolean> {
		return this.once(event.eventId, async (tx) => {
			await tx.registeredUser.createMany({
				data: { userId: event.userId, registeredAt: event.occurredAt },
				skipDuplicates: true,
			});
		});
	}
}
