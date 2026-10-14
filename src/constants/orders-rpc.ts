// Request/reply contract served by orders-api (RabbitMQ only).
export const ORDERS_ADMIN_LIST_PATTERN = 'orders.admin.list';
export const ORDERS_ADMIN_GET_PATTERN = 'orders.admin.get';
export const ORDERS_ADMIN_UPDATE_STATUS_PATTERN = 'orders.admin.updateStatus';

export const ORDERS_READ_PERMISSION = 'orders:read';
export const ORDERS_WRITE_PERMISSION = 'orders:write';

export const ORDER_STATUSES = [
	'pending',
	'confirmed',
	'failed',
	'cancelled',
] as const;
export const ORDER_TARGET_STATUSES = [
	'confirmed',
	'cancelled',
	'failed',
] as const;

export const DEFAULT_ORDERS_RPC_TIMEOUT_MS = 5000;
export const MAX_ORDERS_PAGE_SIZE = 50;
export const ORDERS_ADMIN_ANALYTICS_PATTERN = 'orders.admin.analytics';
// Served by recommendations-api over the same exchange.
export const RECOMMENDATIONS_PURCHASE_MATCH_PATTERN =
	'recommendations.admin.purchaseMatch';
