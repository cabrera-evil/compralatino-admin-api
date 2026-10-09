import { UsersClientModule } from '@/modules/users-client/users-client.module';
import { Module } from '@nestjs/common';
import { MetricsIngestService } from './metrics-ingest.service';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

@Module({
	imports: [UsersClientModule],
	controllers: [MonitoringController],
	providers: [MetricsIngestService, MonitoringService],
	exports: [MetricsIngestService],
})
export class MonitoringModule {}
