import { adapter } from '@/modules/prisma/prisma.service';
import { PrismaClient } from 'prisma/generated/client';
import { seedContent } from './content';

const prisma = new PrismaClient({
	adapter,
	log: [
		{ emit: 'event', level: 'query' },
		{ emit: 'stdout', level: 'error' },
		{ emit: 'stdout', level: 'info' },
		{ emit: 'stdout', level: 'warn' },
	],
});

const main = async () => {
	console.log('[seed] starting...');
	try {
		await seedContent(prisma);
		console.log('[seed] done');
	} catch (error) {
		console.error('[seed] failed', error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
};

void main();
