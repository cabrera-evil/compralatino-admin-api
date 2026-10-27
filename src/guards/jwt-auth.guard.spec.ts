import { AdminAuth } from '@/decorators/auth.decorator';
import { JwtStrategy } from '@/modules/auth/jwt.strategy';
import { UsersClientService } from '@/modules/users-client/users-client.service';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

const SECRET = 'jwt-guard-spec-secret';

@Controller('probe')
class ProbeController {
	@AdminAuth('monitoring:read')
	@Get()
	probe() {
		return { ok: true };
	}
}

// Real passport JwtStrategy + real JwtAuthGuard/PermissionGuard; only users-api is mocked.
describe('JwtAuthGuard + PermissionGuard (HTTP)', () => {
	let app: INestApplication;
	let jwt: JwtService;
	let users: { hasPermission: jest.Mock };
	const previousSecret = process.env.JWT_SECRET;

	beforeAll(async () => {
		process.env.JWT_SECRET = SECRET;
		users = { hasPermission: jest.fn() };
		const moduleRef = await Test.createTestingModule({
			imports: [PassportModule, JwtModule.register({ secret: SECRET })],
			controllers: [ProbeController],
			providers: [
				JwtStrategy,
				{ provide: UsersClientService, useValue: users },
			],
		}).compile();
		app = moduleRef.createNestApplication();
		await app.init();
		jwt = moduleRef.get(JwtService);
	});

	afterAll(async () => {
		await app.close();
		if (previousSecret === undefined) delete process.env.JWT_SECRET;
		else process.env.JWT_SECRET = previousSecret;
	});

	beforeEach(() => users.hasPermission.mockReset());

	it('401 when no token is sent', async () => {
		await request(app.getHttpServer()).get('/probe').expect(401);
		expect(users.hasPermission).not.toHaveBeenCalled();
	});

	it('401 for a token signed with the wrong secret', async () => {
		const bad = jwt.sign({ id: 1 }, { secret: 'other' });
		await request(app.getHttpServer())
			.get('/probe')
			.set('Authorization', `Bearer ${bad}`)
			.expect(401);
	});

	it('401 for an expired token', async () => {
		const expired = jwt.sign({ id: 1 }, { expiresIn: -10 });
		await request(app.getHttpServer())
			.get('/probe')
			.set('Authorization', `Bearer ${expired}`)
			.expect(401);
	});

	it('401 for a token with a non-positive user id', async () => {
		const token = jwt.sign({ id: 0 });
		await request(app.getHttpServer())
			.get('/probe')
			.set('Authorization', `Bearer ${token}`)
			.expect(401);
	});

	it('403 for a valid token whose user lacks the permission', async () => {
		users.hasPermission.mockResolvedValue(false);
		await request(app.getHttpServer())
			.get('/probe')
			.set('Authorization', `Bearer ${jwt.sign({ id: 5 })}`)
			.expect(403);
		expect(users.hasPermission).toHaveBeenCalledWith(5, 'monitoring:read');
	});

	it('200 for a valid token whose user holds the permission', async () => {
		users.hasPermission.mockResolvedValue(true);
		await request(app.getHttpServer())
			.get('/probe')
			.set('Authorization', `Bearer ${jwt.sign({ id: 5 })}`)
			.expect(200, { ok: true });
	});
});
