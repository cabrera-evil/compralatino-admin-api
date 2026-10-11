import { OrdersAdminModule } from '@/modules/orders-admin/orders-admin.module';
import { UsersClientModule } from '@/modules/users-client/users-client.module';
import { Module } from '@nestjs/common';
import { MetricsIngestService } from './metrics-ingest.service';
import { MonitoringBiService } from './monitoring-bi.service';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

@Module({
	imports: [UsersClientModule, OrdersAdminModule],
	controllers: [MonitoringController],
	providers: [MetricsIngestService, MonitoringService, MonitoringBiService],
	exports: [MetricsIngestService],
})
export class MonitoringModule {}
