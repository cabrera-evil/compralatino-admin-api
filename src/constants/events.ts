// Published by orders_svc, consumed by recommendations_svc and admin_svc.
// See Fase-2-CompraLatino-Mermaid.md 2.2 (Módulo administrativo) and 3.2 (diagrama de contenedores).
export const OrderEventPattern = {
	CREATED: 'order.created',
	UPDATED: 'order.updated',
} as const;

// Published by users_svc, consumed by admin_svc (new-users KPI).
export const UserEventPattern = {
	REGISTERED: 'user.registered',
} as const;
