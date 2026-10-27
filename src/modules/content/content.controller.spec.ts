import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

describe('ContentController (HTTP, mocked service)', () => {
	let app: INestApplication;
	let content: Record<string, jest.Mock>;

	beforeEach(async () => {
		content = {
			stats: jest.fn().mockResolvedValue({ data: [] }),
			howItWorks: jest.fn().mockResolvedValue({ data: [] }),
			costExample: jest.fn().mockResolvedValue({ data: {} }),
			faq: jest.fn().mockResolvedValue({ data: [] }),
			authBrand: jest.fn().mockResolvedValue({ data: {} }),
		};
		const moduleRef = await Test.createTestingModule({
			controllers: [ContentController],
			providers: [{ provide: ContentService, useValue: content }],
		}).compile();
		app = moduleRef.createNestApplication();
		await app.init();
	});

	afterEach(() => app.close());

	it.each([
		['/admin/content/home/stats', 'stats'],
		['/admin/content/home/how-it-works', 'howItWorks'],
		['/admin/content/home/cost-example', 'costExample'],
		['/admin/content/home/faq', 'faq'],
		['/admin/content/auth/brand', 'authBrand'],
	])('GET %s returns 200 from %s', async (url, method) => {
		await request(app.getHttpServer()).get(url).expect(200);
		expect(content[method]).toHaveBeenCalledTimes(1);
	});

	it('returns 404 when content is missing', async () => {
		content.costExample.mockRejectedValue(
			new NotFoundException('CONTENT_NOT_FOUND')
		);
		const res = await request(app.getHttpServer())
			.get('/admin/content/home/cost-example')
			.expect(404);
		expect(res.body.message).toBe('CONTENT_NOT_FOUND');
	});

	it('returns 404 for an unknown content path and 404 for non-GET verbs', async () => {
		await request(app.getHttpServer()).get('/admin/content/nope').expect(404);
		await request(app.getHttpServer())
			.post('/admin/content/home/stats')
			.expect(404);
	});
});
