import { BadRequestException } from '@nestjs/common';
import { parseDateRange } from './date-range';

describe('parseDateRange (America/El_Salvador, UTC-6)', () => {
	it('is undefined when no range is given', () => {
		expect(parseDateRange({})).toBeUndefined();
	});

	it('covers inclusive local days: 23:30 on the last day in, 00:30 next day out', () => {
		const { gte, lte } = parseDateRange({
			from: '2026-01-01',
			to: '2026-01-31',
		})!;
		expect(gte.toISOString()).toBe('2026-01-01T06:00:00.000Z');
		const lastDay2330 = new Date('2026-01-31T23:30:00-06:00');
		const nextDay0030 = new Date('2026-02-01T00:30:00-06:00');
		expect(lastDay2330 >= gte && lastDay2330 <= lte).toBe(true);
		expect(nextDay0030 <= lte).toBe(false);
		expect(new Date('2025-12-31T23:59:59.999-06:00') >= gte).toBe(false);
	});

	it.each([
		[{ from: '2026-01-01' }],
		[{ to: '2026-01-01' }],
		[{ from: '2026-01-02', to: '2026-01-01' }],
		[{ from: '2026-02-30', to: '2026-03-05' }],
		[{ from: '2026-02-01', to: '2026-02-31' }],
		[{ from: '2025-02-29', to: '2025-03-05' }],
		[{ from: 'nope', to: '2026-03-01' }],
		[{ from: 20260101, to: '2026-03-01' }],
	])('rejects %j', (q) => {
		expect(() => parseDateRange(q)).toThrow(BadRequestException);
	});

	it('caps the span at 366 inclusive days', () => {
		expect(
			parseDateRange({ from: '2026-01-01', to: '2026-12-31' })
		).toBeDefined(); // 365
		expect(
			parseDateRange({ from: '2024-01-01', to: '2024-12-31' })
		).toBeDefined(); // 366
		expect(() =>
			parseDateRange({ from: '2026-01-01', to: '2027-01-02' })
		).toThrow(BadRequestException);
		expect(() =>
			parseDateRange({ from: '2025-01-01', to: '2026-01-02' })
		).toThrow(BadRequestException);
	});
});
