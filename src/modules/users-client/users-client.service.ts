import { RABBITMQ_SERVICE } from '@/constants/rabbitmq';
import {
	DEFAULT_PERMISSIONS_CACHE_TTL_MS,
	DEFAULT_USERS_RPC_TIMEOUT_MS,
	USERS_PERMISSIONS_PATTERN,
} from '@/constants/users-rpc';
import {
	Inject,
	Injectable,
	Logger,
	Optional,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

type PermissionsRequest = { userId: number };
type PermissionsReply = {
	userId: number;
	roles: string[];
	permissions: string[];
};

/** Request/reply to users-api over RabbitMQ; the only source of a caller's permissions. */
@Injectable()
export class UsersClientService {
	private readonly logger = new Logger(UsersClientService.name);
	private readonly cache = new Map<
		number,
		{ permissions: Set<string>; expiresAt: number }
	>();

	constructor(
		@Optional()
		@Inject(RABBITMQ_SERVICE)
		private readonly client?: ClientProxy
	) {}

	/** Throws 503 USERS_UNAVAILABLE on any failure (fail closed). Cached for PERMISSIONS_CACHE_TTL_MS (0 disables). */
	async hasPermission(userId: number, permission: string): Promise<boolean> {
		return (await this.permissionsOf(userId)).has(permission);
	}

	private async permissionsOf(userId: number): Promise<Set<string>> {
		const ttl = Number(
			process.env.PERMISSIONS_CACHE_TTL_MS ?? DEFAULT_PERMISSIONS_CACHE_TTL_MS
		);
		const cached = this.cache.get(userId);
		if (ttl > 0 && cached && cached.expiresAt > Date.now())
			return cached.permissions;
		const permissions = new Set((await this.request(userId)).permissions);
		if (ttl > 0)
			this.cache.set(userId, { permissions, expiresAt: Date.now() + ttl });
		else this.cache.delete(userId);
		return permissions;
	}

	private async request(userId: number): Promise<PermissionsReply> {
		if (!this.client) throw this.unavailable('RabbitMQ is disabled');
		const ms =
			Number(process.env.USERS_RPC_TIMEOUT_MS) || DEFAULT_USERS_RPC_TIMEOUT_MS;
		try {
			const reply = await firstValueFrom(
				this.client
					.send<
						PermissionsReply,
						PermissionsRequest
					>(USERS_PERMISSIONS_PATTERN, { userId })
					.pipe(timeout(ms))
			);
			if (
				reply?.userId !== userId ||
				!Array.isArray(reply.permissions) ||
				!reply.permissions.every((p) => typeof p === 'string')
			)
				throw new Error('Malformed users reply');
			return reply;
		} catch (error) {
			throw this.unavailable(
				error instanceof Error ? error.message : String(error)
			);
		}
	}

	private unavailable(reason: string) {
		this.logger.warn(`users permissions request failed: ${reason}`);
		return new ServiceUnavailableException('USERS_UNAVAILABLE');
	}
}
