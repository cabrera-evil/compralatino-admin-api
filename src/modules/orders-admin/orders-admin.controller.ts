import {
	ORDERS_READ_PERMISSION,
	ORDERS_WRITE_PERMISSION,
} from '@/constants/orders-rpc';
import { AdminAuth } from '@/decorators/auth.decorator';
import { RisonQuery } from '@/decorators/rison-query.decorator';
import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersListQueryDto, UpdateOrderStatusDto } from './orders-admin.dto';
import { OrdersClientService } from './orders-client.service';

const strict = new ValidationPipe({
	transform: true,
	whitelist: true,
	forbidNonWhitelisted: true,
	validateCustomDecorators: true,
});

@ApiTags('orders')
@Controller({ path: 'admin/orders', version: '1' })
export class OrdersAdminController {
	constructor(private readonly orders: OrdersClientService) {}

	@AdminAuth(ORDERS_READ_PERMISSION)
	@ApiOperation({ summary: 'List all orders (served by orders-api)' })
	@ApiQuery({
		name: 'q',
		required: false,
		description:
			'Rison: (page:1,pageSize:10,status:pending), pageSize max 50, status lowercase',
	})
	@Get()
	list(@RisonQuery({ paginate: false }, strict) query: OrdersListQueryDto) {
		return this.orders.list(query);
	}

	@AdminAuth(ORDERS_READ_PERMISSION)
	@ApiOperation({ summary: 'Get one order with items' })
	@Get(':id')
	get(@Param('id', ParseIntPipe) id: number) {
		return this.orders.get(id);
	}

	@AdminAuth(ORDERS_WRITE_PERMISSION)
	@ApiOperation({
		summary: 'Move a PENDING order to confirmed | cancelled | failed',
	})
	@Patch(':id/status')
	updateStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body(strict) { status }: UpdateOrderStatusDto
	) {
		return this.orders.updateStatus(id, status);
	}
}
