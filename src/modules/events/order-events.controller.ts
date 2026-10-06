import { OrderEventPattern } from '@/constants/events';
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

interface OrderCreatedEvent {
	orderId: number;
	userId: number;
	status: string;
	totalAmount: string;
	orderDate: string;
}

interface OrderUpdatedEvent {
	orderId: number;
	status: string;
}

@Controller()
export class OrderEventsController {
	private readonly logger = new Logger(OrderEventsController.name);

	@EventPattern(OrderEventPattern.CREATED)
	handleOrderCreated(
		@Payload() data: OrderCreatedEvent,
		@Ctx() context: RmqContext
	): void {
		this.logger.log(
			`Received "${OrderEventPattern.CREATED}": ${JSON.stringify(data)}`
		);

		// TODO: admin_svc business logic (see Fase-2-CompraLatino-Mermaid.md 4.3 —
		// admin_svc has no owned tables yet; "pendiente de precisar").

		const channel = context.getChannelRef();
		channel.ack(context.getMessage());
	}

	@EventPattern(OrderEventPattern.UPDATED)
	handleOrderUpdated(
		@Payload() data: OrderUpdatedEvent,
		@Ctx() context: RmqContext
	): void {
		this.logger.log(
			`Received "${OrderEventPattern.UPDATED}": ${JSON.stringify(data)}`
		);

		// TODO: admin_svc business logic (see Fase-2-CompraLatino-Mermaid.md 4.3).

		const channel = context.getChannelRef();
		channel.ack(context.getMessage());
	}
}
