import {
	MAX_ORDERS_PAGE_SIZE,
	ORDER_STATUSES,
	ORDER_TARGET_STATUSES,
} from '@/constants/orders-rpc';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class OrdersListQueryDto {
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(MAX_ORDERS_PAGE_SIZE)
	pageSize?: number;

	@IsOptional()
	@IsIn(ORDER_STATUSES)
	status?: (typeof ORDER_STATUSES)[number];
}

export class UpdateOrderStatusDto {
	@IsIn(ORDER_TARGET_STATUSES)
	status!: (typeof ORDER_TARGET_STATUSES)[number];
}
