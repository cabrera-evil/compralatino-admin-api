import { Money } from '@/types/money.type';
import { Prisma } from 'prisma/generated/client';

// Numbers appear only at serialization time; all arithmetic stays in Decimal.
export const toUsd = (amount: Prisma.Decimal): Money<'USD'> => ({
	amount: amount.toNumber(),
	currency: 'USD',
});
