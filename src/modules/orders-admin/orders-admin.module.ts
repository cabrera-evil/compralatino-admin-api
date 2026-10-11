import { UsersClientModule } from '@/modules/users-client/users-client.module';
import { Module } from '@nestjs/common';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersClientService } from './orders-client.service';

@Module({
	imports: [UsersClientModule],
	controllers: [OrdersAdminController],
	providers: [OrdersClientService],
	exports: [OrdersClientService],
})
export class OrdersAdminModule {}
