import { MONITORING_TIME_ZONE } from '@/constants/monitoring';
import { toUsd } from '@/utils/money.util';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'prisma/generated/client';
import {
	OrdersClientService,
	TopProduct,
} from '../orders-admin/orders-client.service';
import { parseDateRange } from './date-range';

const product = ({ revenue, ...rest }: TopProduct) => ({
	...rest,
	revenue: toUsd(new Prisma.Decimal(revenue)),
});

@Injectable()
export class MonitoringBiService {
	private readonly logger = new Logger(MonitoringBiService.name);

	constructor(private readonly orders: OrdersClientService) {}

	async getBi(query: { from?: string; to?: string }) {
		const range = parseDateRange(query);
		if (!range) throw new BadRequestException('INVALID_DATE_RANGE');
		const { funnel, topProducts, matchSample } = await this.orders.analytics({
			from: range.gte.toISOString(),
			to: range.lte.toISOString(),
		});
		// Optional enrichment: a recommendations outage must not break the dashboard.
		const recommendationMatch = matchSample.length
			? await this.orders.purchaseMatch(matchSample).catch((error) => {
					this.logger.warn(`purchase-match unavailable: ${error?.message}`);
					return null;
				})
			: { sampledOrders: 0, matchedOrders: 0, rate: 0 };
		return {
			data: {
				generatedAt: new Date().toISOString(),
				range: {
					from: query.from,
					to: query.to,
					timeZone: MONITORING_TIME_ZONE,
				},
				funnel,
				topProducts: {
					byUnits: topProducts.byUnits.map(product),
					byRevenue: topProducts.byRevenue.map(product),
				},
				recommendationMatch,
			},
		};
	}
}
