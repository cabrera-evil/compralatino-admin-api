import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RisonQuery } from './rison-query.decorator';

const run = (opts: { paginate: boolean }, q?: string) => {
	class Host {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		handler(@RisonQuery(opts) _query: unknown) {}
	}
	const meta = Reflect.getMetadata(ROUTE_ARGS_METADATA, Host, 'handler');
	const { factory } = meta[Object.keys(meta)[0]];
	const ctx = {
		switchToHttp: () => ({ getRequest: () => ({ query: { q } }) }),
	} as unknown as ExecutionContext;
	return factory(opts, ctx);
};

describe('RisonQuery', () => {
	it('forwards page and pageSize when paginate is false', () => {
		expect(
			run({ paginate: false }, '(page:2,pageSize:5,status:pending)')
		).toEqual({
			page: 2,
			pageSize: 5,
			status: 'pending',
		});
	});

	it('omits page/pageSize when absent (paginate false)', () => {
		expect(run({ paginate: false }, '(status:pending)')).toEqual({
			status: 'pending',
		});
	});

	it('still converts to take/skip when paginate is true', () => {
		expect(run({ paginate: true }, '(page:2,pageSize:5)')).toEqual({
			take: 5,
			skip: 5,
		});
	});
});
