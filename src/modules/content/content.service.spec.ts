import { ContentSection } from '@/constants/content';
import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';

describe('ContentService', () => {
	let prisma: any;
	let service: ContentService;
	const entry = (key: string, data: object) => ({ key, data });

	beforeEach(() => {
		prisma = {
			contentEntry: { findMany: jest.fn(), findUnique: jest.fn() },
		};
		service = new ContentService(prisma);
	});

	it('stats maps entries to {id, ...data} ordered by position', async () => {
		prisma.contentEntry.findMany.mockResolvedValue([entry('a', { value: 1 })]);
		await expect(service.stats()).resolves.toEqual({
			data: [{ id: 'a', value: 1 }],
		});
		expect(prisma.contentEntry.findMany).toHaveBeenCalledWith({
			where: { section: ContentSection.HOME_STATS },
			orderBy: { position: 'asc' },
		});
	});

	it('propagates database failures', async () => {
		prisma.contentEntry.findMany.mockRejectedValue(new Error('db'));
		await expect(service.faq()).rejects.toThrow('db');
	});

	describe('costExample', () => {
		it('returns USD lines, total and footnote', async () => {
			prisma.contentEntry.findMany.mockImplementation(({ where }: any) =>
				where.section === ContentSection.HOME_COST_LINES
					? [entry('l1', { label: 'Item', amount: '10.5' })]
					: [
							entry('total', { label: 'Total', amount: '12' }),
							entry('footnote', { text: 'note' }),
						]
			);
			await expect(service.costExample()).resolves.toEqual({
				data: {
					lines: [
						{
							id: 'l1',
							label: 'Item',
							amount: { amount: 10.5, currency: 'USD' },
						},
					],
					total: {
						id: 'total',
						label: 'Total',
						amount: { amount: 12, currency: 'USD' },
					},
					footnote: 'note',
				},
			});
		});

		it('throws NotFound when total or footnote is missing', async () => {
			prisma.contentEntry.findMany.mockResolvedValue([]);
			await expect(service.costExample()).rejects.toThrow(
				new NotFoundException('CONTENT_NOT_FOUND')
			);
		});
	});

	describe('authBrand', () => {
		it('merges headline with benefits and metrics', async () => {
			prisma.contentEntry.findUnique.mockResolvedValue(
				entry('headline', { title: 'Hi' })
			);
			prisma.contentEntry.findMany.mockResolvedValue([entry('b', { x: 1 })]);
			await expect(service.authBrand()).resolves.toEqual({
				data: {
					title: 'Hi',
					benefits: [{ id: 'b', x: 1 }],
					metrics: [{ id: 'b', x: 1 }],
				},
			});
		});

		it('throws NotFound when the headline is missing', async () => {
			prisma.contentEntry.findUnique.mockResolvedValue(null);
			prisma.contentEntry.findMany.mockResolvedValue([]);
			await expect(service.authBrand()).rejects.toThrow(NotFoundException);
		});
	});
});
