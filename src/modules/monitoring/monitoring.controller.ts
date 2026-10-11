import { MONITORING_READ_PERMISSION } from '@/constants/users-rpc';
import { AdminAuth } from '@/decorators/auth.decorator';
import { RisonQuery } from '@/decorators/rison-query.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MonitoringBiService } from './monitoring-bi.service';
import { MonitoringQuery, MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@AdminAuth(MONITORING_READ_PERMISSION)
@Controller({ path: 'admin/monitoring', version: '1' })
export class MonitoringController {
	constructor(
		private readonly monitoringService: MonitoringService,
		private readonly bi: MonitoringBiService
	) {}

	@ApiOperation({
		summary: 'Event-fed KPIs plus a paginated recent-orders list (admin only)',
	})
	@ApiQuery({
		name: 'q',
		required: false,
		description:
			"Rison: (page:1,pageSize:10) max 50; optional range (from:'2026-01-01',to:'2026-01-31') as inclusive America/El_Salvador days, both or neither",
	})
	@Get()
	getSnapshot(@RisonQuery({ paginate: true }) query: MonitoringQuery) {
		return this.monitoringService.getSnapshot(query);
	}

	@ApiOperation({
		summary:
			'BI for a date range: order funnel, top products, recommendation purchase-match (admin only)',
	})
	@ApiQuery({
		name: 'q',
		required: true,
		description:
			"Rison: (from:'2026-01-01',to:'2026-01-31'), inclusive America/El_Salvador days",
	})
	@Get('bi')
	getBi(
		@RisonQuery({ paginate: false }) query: { from?: string; to?: string }
	) {
		return this.bi.getBi(query);
	}
}
