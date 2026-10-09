import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller({ path: 'admin/content', version: '1' })
export class ContentController {
	constructor(private readonly contentService: ContentService) {}

	@ApiOperation({ summary: 'Public: home stats' })
	@Get('home/stats')
	stats() {
		return this.contentService.stats();
	}

	@ApiOperation({ summary: 'Public: home how-it-works steps' })
	@Get('home/how-it-works')
	howItWorks() {
		return this.contentService.howItWorks();
	}

	@ApiOperation({ summary: 'Public: home cost example' })
	@Get('home/cost-example')
	costExample() {
		return this.contentService.costExample();
	}

	@ApiOperation({ summary: 'Public: home FAQ' })
	@Get('home/faq')
	faq() {
		return this.contentService.faq();
	}

	@ApiOperation({ summary: 'Public: login brand panel content' })
	@Get('auth/brand')
	authBrand() {
		return this.contentService.authBrand();
	}
}
