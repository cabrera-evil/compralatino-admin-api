import { toUsd } from '@/utils/money.util';
import { OrderSnapshot, OrderStatus, Prisma } from 'prisma/generated/client';

export type MonitoringKpis = {
	orderCount: number;
	salesTotal: Prisma.Decimal;
	newUsers: number;
	ordersByStatus: Record<OrderStatus, number>;
};

export const serializeKpis = (kpis: MonitoringKpis) => ({
	orderCount: kpis.orderCount,
	salesTotal: toUsd(kpis.salesTotal),
	newUsers: kpis.newUsers,
	ordersByStatus: {
		pending: kpis.ordersByStatus.PENDING,
		confirmed: kpis.ordersByStatus.CONFIRMED,
		failed: kpis.ordersByStatus.FAILED,
		cancelled: kpis.ordersByStatus.CANCELLED,
	},
});

export const serializeRecentOrder = (order: OrderSnapshot) => ({
	orderId: order.orderId,
	userId: order.userId,
	status: order.status.toLowerCase(),
	total: order.totalAmount ? toUsd(order.totalAmount) : null,
	orderDate: order.orderDate?.toISOString() ?? null,
	statusUpdatedAt: order.statusAt.toISOString(),
});
