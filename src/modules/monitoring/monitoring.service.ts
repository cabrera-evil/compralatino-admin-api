import {
	DEFAULT_RECENT_ORDERS_PAGE_SIZE,
	MAX_RECENT_ORDERS_PAGE_SIZE,
} from '@/constants/monitoring';
import { getPaginationMeta } from '@/utils/prisma.utils';
import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, PrismaClient } from 'prisma/generated/client';
import { parseDateRange } from './date-range';
import {
	MonitoringKpis,
	serializeKpis,
	serializeRecentOrder,
} from './monitoring.serializer';

export type MonitoringQuery = {
	take?: number;
	skip?: number;
	/** Inclusive YYYY-MM-DD days (America/El_Salvador); both or neither. */
	from?: string;
	to?: string;
};

// Cancelled and failed orders are not sales.
const NON_SALE_STATUSES: OrderStatus[] = [
	OrderStatus.CANCELLED,
	OrderStatus.FAILED,
];

@Injectable()
export class MonitoringService {
	constructor(private readonly prisma: PrismaClient) {}

	async getSnapshot({ take, skip, from, to }: MonitoringQuery) {
		const range = parseDateRange({ from, to });
		const inRange: Prisma.OrderSnapshotWhereInput | undefined = range && {
			orderDate: range,
		};
		const page = {
			take: Math.min(
				take ?? DEFAULT_RECENT_ORDERS_PAGE_SIZE,
				MAX_RECENT_ORDERS_PAGE_SIZE
			),
			skip: skip ?? 0,
		};
		const [orderCount, sales, byStatus, newUsers, recent] = await Promise.all([
			this.prisma.orderSnapshot.count({ where: inRange }),
			this.prisma.orderSnapshot.aggregate({
				_sum: { totalAmount: true },
				where: { ...inRange, status: { notIn: NON_SALE_STATUSES } },
			}),
			this.prisma.orderSnapshot.groupBy({
				by: ['status'],
				where: inRange,
				_count: { _all: true },
			}),
			this.prisma.registeredUser.count({
				where: range && { registeredAt: range },
			}),
			this.prisma.orderSnapshot.findMany({
				...page,
				where: inRange,
				orderBy: [
					{ orderDate: { sort: 'desc', nulls: 'last' } },
					{ orderId: 'desc' },
				],
			}),
		]);

		const ordersByStatus = Object.fromEntries(
			Object.values(OrderStatus).map((status) => [status, 0])
		) as MonitoringKpis['ordersByStatus'];
		for (const { status, _count } of byStatus)
			ordersByStatus[status] = _count._all;

		return {
			data: {
				generatedAt: new Date().toISOString(),
				kpis: serializeKpis({
					orderCount,
					salesTotal: sales._sum.totalAmount ?? new Prisma.Decimal(0),
					newUsers,
					ordersByStatus,
				}),
				recentOrders: recent.map(serializeRecentOrder),
			},
			pagination: getPaginationMeta(page.take, page.skip, orderCount),
		};
	}
}
