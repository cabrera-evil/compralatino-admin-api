import { Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';

/** Malformed payload: log and ack (no change). Handler failure: nack with requeue; ingestion is idempotent. */
export const consumeEvent = async <T>(
	logger: Logger,
	pattern: string,
	data: unknown,
	context: RmqContext,
	parse: (data: unknown) => T | null,
	handle: (payload: T) => Promise<boolean>
): Promise<void> => {
	const channel = context.getChannelRef();
	const message = context.getMessage();
	try {
		const payload = parse(data);
		if (!payload) {
			logger.warn(`Ignoring malformed "${pattern}" payload`);
		} else if (!(await handle(payload))) {
			logger.log(`Duplicate "${pattern}" ignored`);
		}
		channel.ack(message);
	} catch (error) {
		logger.error(`Failed to process "${pattern}": ${String(error)}`);
		channel.nack(message, false, true);
	}
};
