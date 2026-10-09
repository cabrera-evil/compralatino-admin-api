import { MONITORING_READ_PERMISSION } from '@/constants/users-rpc';
import { AdminAuth } from '@/decorators/auth.decorator';
import { RisonQuery } from '@/decorators/rison-query.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MonitoringQuery, MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@AdminAuth(MONITORING_READ_PERMISSION)
@Controller({ path: 'admin/monitoring', version: '1' })
export class MonitoringController {
	constructor(private readonly monitoringService: MonitoringService) {}

	@ApiOperation({
		summary: 'Event-fed KPIs plus a paginated recent-orders list (admin only)',
	})
	@ApiQuery({
		name: 'q',
		required: false,
		description: 'Rison for recentOrders paging: (page:1,pageSize:10), max 50',
	})
	@Get()
	getSnapshot(@RisonQuery({ paginate: true }) query: MonitoringQuery) {
		return this.monitoringService.getSnapshot(query);
	}
}
