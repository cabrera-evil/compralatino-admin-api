// Request/reply contract served by users-api (RabbitMQ only).
export const USERS_PERMISSIONS_PATTERN = 'users.permissions.get';

export const MONITORING_READ_PERMISSION = 'monitoring:read';

export const DEFAULT_USERS_RPC_TIMEOUT_MS = 5000;
export const DEFAULT_PERMISSIONS_CACHE_TTL_MS = 30000;
