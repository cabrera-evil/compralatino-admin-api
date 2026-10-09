import { OrderEventPattern } from '@/constants/events';
import { MetricsIngestService } from '@/modules/monitoring/metrics-ingest.service';
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { consumeEvent } from './event-consumer.util';
import { parseOrderCreated, parseOrderUpdated } from './event-payloads';

@Controller()
export class OrderEventsController {
	private readonly logger = new Logger(OrderEventsController.name);

	constructor(private readonly metrics: MetricsIngestService) {}

	@EventPattern(OrderEventPattern.CREATED)
	handleOrderCreated(@Payload() data: unknown, @Ctx() context: RmqContext) {
		return consumeEvent(
			this.logger,
			OrderEventPattern.CREATED,
			data,
			context,
			parseOrderCreated,
			(payload) => this.metrics.recordOrderCreated(payload)
		);
	}

	@EventPattern(OrderEventPattern.UPDATED)
	handleOrderUpdated(@Payload() data: unknown, @Ctx() context: RmqContext) {
		return consumeEvent(
			this.logger,
			OrderEventPattern.UPDATED,
			data,
			context,
			parseOrderUpdated,
			(payload) => this.metrics.recordOrderUpdated(payload)
		);
	}
}
