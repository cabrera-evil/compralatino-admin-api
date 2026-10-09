import { MonitoringModule } from '@/modules/monitoring/monitoring.module';
import { Module } from '@nestjs/common';
import { OrderEventsController } from './order-events.controller';
import { UserEventsController } from './user-events.controller';

@Module({
	imports: [MonitoringModule],
	controllers: [OrderEventsController, UserEventsController],
})
export class EventsModule {}
