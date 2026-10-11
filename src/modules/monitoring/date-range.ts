import { BadRequestException } from '@nestjs/common';

export type DateRange = { gte: Date; lte: Date };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
// El Salvador is UTC-6 all year (no DST).
const OFFSET = '-06:00';
const OFFSET_MS = 6 * 3_600_000;
const MAX_RANGE_DAYS = 366;

const parseDay = (value: unknown, time: string): Date => {
	const date =
		typeof value === 'string' && DAY.test(value)
			? new Date(`${value}T${time}${OFFSET}`)
			: undefined;
	// Round-trip the local wall date: JS silently rolls 2026-02-30 over to March.
	const wall = date && !isNaN(+date) && new Date(+date - OFFSET_MS);
	if (!wall || wall.toISOString().slice(0, 10) !== value)
		throw new BadRequestException('INVALID_DATE_RANGE');
	return date;
};

/** `from`/`to` are inclusive YYYY-MM-DD days in America/El_Salvador; undefined when both are absent. */
export const parseDateRange = (query: {
	from?: unknown;
	to?: unknown;
}): DateRange | undefined => {
	if (query.from === undefined && query.to === undefined) return undefined;
	const gte = parseDay(query.from, '00:00:00.000');
	const lte = parseDay(query.to, '23:59:59.999');
	const days = Math.round((+lte - +gte + 1) / 86_400_000);
	if (gte > lte || days > MAX_RANGE_DAYS)
		throw new BadRequestException('INVALID_DATE_RANGE');
	return { gte, lte };
};
