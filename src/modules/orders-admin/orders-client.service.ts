import {
	DEFAULT_ORDERS_RPC_TIMEOUT_MS,
	ORDERS_ADMIN_ANALYTICS_PATTERN,
	ORDERS_ADMIN_GET_PATTERN,
	ORDERS_ADMIN_LIST_PATTERN,
	ORDERS_ADMIN_UPDATE_STATUS_PATTERN,
	RECOMMENDATIONS_PURCHASE_MATCH_PATTERN,
} from '@/constants/orders-rpc';
import { RABBITMQ_SERVICE } from '@/constants/rabbitmq';
import {
	BadRequestException,
	ConflictException,
	HttpException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	Optional,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

export type AdminOrdersListRequest = {
	page?: number;
	pageSize?: number;
	status?: string;
};
// Shape owned by orders-api (serializeOrder + userId); passed through untouched.
export type AdminOrder = Record<string, unknown> & { id: number };
export type AdminOrdersListReply = {
	items: AdminOrder[];
	total: number;
	page: number;
	pageSize: number;
};

export type OrdersAnalyticsReply = {
	funnel: {
		placed: number;
		confirmed: number;
		paid: number;
		delivered: number;
	};
	topProducts: Record<'byUnits' | 'byRevenue', TopProduct[]>;
	matchSample: { orderId: number; userId: number; productCodes: string[] }[];
};
// revenue is a decimal string (orders-api keeps money in Decimal).
export type TopProduct = {
	productCode: string;
	title: string;
	units: number;
	revenue: string;
};
export type PurchaseMatchReply = {
	sampledOrders: number;
	matchedOrders: number;
	rate: number;
};

const DOMAIN_ERRORS: Record<number, new (message: string) => HttpException> = {
	400: BadRequestException,
	404: NotFoundException,
	409: ConflictException,
};

/** Request/reply to orders-api over RabbitMQ (shared exchange, routed by pattern). */
@Injectable()
export class OrdersClientService {
	private readonly logger = new Logger(OrdersClientService.name);

	constructor(
		@Optional()
		@Inject(RABBITMQ_SERVICE)
		private readonly client?: ClientProxy
	) {}

	list(query: AdminOrdersListRequest) {
		return this.request<AdminOrdersListReply>(ORDERS_ADMIN_LIST_PATTERN, query);
	}

	/** `from`/`to` are ISO instants (inclusive). */
	analytics(range: { from: string; to: string }) {
		return this.request<OrdersAnalyticsReply>(
			ORDERS_ADMIN_ANALYTICS_PATTERN,
			range
		);
	}

	/** Answered by recommendations-api; shares the request/reply plumbing. */
	purchaseMatch(orders: OrdersAnalyticsReply['matchSample']) {
		return this.request<PurchaseMatchReply>(
			RECOMMENDATIONS_PURCHASE_MATCH_PATTERN,
			{ orders }
		);
	}

	get(id: number) {
		return this.request<AdminOrder>(ORDERS_ADMIN_GET_PATTERN, { id });
	}

	updateStatus(id: number, status: string) {
		return this.request<AdminOrder>(ORDERS_ADMIN_UPDATE_STATUS_PATTERN, {
			id,
			status,
		});
	}

	/** Domain errors (400/404/409) pass through; anything else is 503 ORDERS_UNAVAILABLE. */
	private async request<T>(pattern: string, payload: object): Promise<T> {
		if (!this.client) throw this.unavailable(pattern, 'RabbitMQ is disabled');
		const ms =
			Number(process.env.ORDERS_RPC_TIMEOUT_MS) ||
			DEFAULT_ORDERS_RPC_TIMEOUT_MS;
		try {
			return await firstValueFrom(
				this.client.send<T>(pattern, payload).pipe(timeout(ms))
			);
		} catch (error) {
			const { statusCode, message } = (error ?? {}) as {
				statusCode?: number;
				message?: unknown;
			};
			const Domain = statusCode ? DOMAIN_ERRORS[statusCode] : undefined;
			if (Domain && typeof message === 'string') throw new Domain(message);
			throw this.unavailable(
				pattern,
				error instanceof Error ? error.message : String(message ?? error)
			);
		}
	}

	private unavailable(pattern: string, reason: string) {
		this.logger.warn(`${pattern} request failed: ${reason}`);
		return new ServiceUnavailableException('ORDERS_UNAVAILABLE');
	}
}
