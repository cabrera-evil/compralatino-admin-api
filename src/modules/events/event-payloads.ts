import { OrderStatus } from 'prisma/generated/client';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DECIMAL = /^\d+(\.\d+)?$/;

export interface OrderCreatedPayload {
	eventId: string;
	orderId: number;
	userId: number;
	status: OrderStatus;
	totalAmount: string;
	orderDate: Date;
}

export interface OrderUpdatedPayload {
	eventId: string;
	orderId: number;
	userId: number;
	status: OrderStatus;
	updatedAt: Date;
}

export interface UserRegisteredPayload {
	eventId: string;
	userId: number;
	occurredAt: Date;
}

type Raw = Record<string, unknown>;

const isRaw = (data: unknown): data is Raw =>
	typeof data === 'object' && data !== null;

const eventId = (raw: Raw): string | null =>
	typeof raw.eventId === 'string' && UUID.test(raw.eventId)
		? raw.eventId
		: null;

const id = (value: unknown): number | null =>
	Number.isInteger(value) && (value as number) > 0 ? (value as number) : null;

const date = (value: unknown): Date | null => {
	if (typeof value !== 'string') return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const status = (value: unknown): OrderStatus | null => {
	const key = typeof value === 'string' ? value.toUpperCase() : '';
	return key in OrderStatus
		? OrderStatus[key as keyof typeof OrderStatus]
		: null;
};

export const parseOrderCreated = (
	data: unknown
): OrderCreatedPayload | null => {
	if (!isRaw(data)) return null;
	const payload = {
		eventId: eventId(data),
		orderId: id(data.orderId),
		userId: id(data.userId),
		status: status(data.status),
		totalAmount:
			typeof data.totalAmount === 'string' && DECIMAL.test(data.totalAmount)
				? data.totalAmount
				: null,
		orderDate: date(data.orderDate),
	};
	return Object.values(payload).every((v) => v !== null)
		? (payload as OrderCreatedPayload)
		: null;
};

export const parseOrderUpdated = (
	data: unknown
): OrderUpdatedPayload | null => {
	if (!isRaw(data)) return null;
	const payload = {
		eventId: eventId(data),
		orderId: id(data.orderId),
		userId: id(data.userId),
		status: status(data.status),
		updatedAt: date(data.updatedAt),
	};
	return Object.values(payload).every((v) => v !== null)
		? (payload as OrderUpdatedPayload)
		: null;
};

export const parseUserRegistered = (
	data: unknown
): UserRegisteredPayload | null => {
	if (!isRaw(data)) return null;
	const payload = {
		eventId: eventId(data),
		userId: id(data.userId),
		occurredAt: date(data.occurredAt),
	};
	return Object.values(payload).every((v) => v !== null)
		? (payload as UserRegisteredPayload)
		: null;
};
