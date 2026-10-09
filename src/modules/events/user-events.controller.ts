import { UserEventPattern } from '@/constants/events';
import { MetricsIngestService } from '@/modules/monitoring/metrics-ingest.service';
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { consumeEvent } from './event-consumer.util';
import { parseUserRegistered } from './event-payloads';

@Controller()
export class UserEventsController {
	private readonly logger = new Logger(UserEventsController.name);

	constructor(private readonly metrics: MetricsIngestService) {}

	@EventPattern(UserEventPattern.REGISTERED)
	handleUserRegistered(@Payload() data: unknown, @Ctx() context: RmqContext) {
		return consumeEvent(
			this.logger,
			UserEventPattern.REGISTERED,
			data,
			context,
			parseUserRegistered,
			(payload) => this.metrics.recordUserRegistered(payload)
		);
	}
}
