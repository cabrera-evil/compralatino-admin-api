import { ContentKey, ContentSection } from '@/constants/content';
import { toUsd } from '@/utils/money.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from 'prisma/generated/client';
import {
	BenefitData,
	BrandHeadlineData,
	ContentItem,
	CostFootnoteData,
	CostLineData,
	FaqData,
	MetricData,
	StatData,
	StepData,
} from './content.types';

@Injectable()
export class ContentService {
	constructor(private readonly prisma: PrismaClient) {}

	private async items<T extends object>(
		section: string
	): Promise<ContentItem<T>[]> {
		const entries = await this.prisma.contentEntry.findMany({
			where: { section },
			orderBy: { position: 'asc' },
		});
		return entries.map(({ key, data }) => ({ id: key, ...(data as T) }));
	}

	private async item<T extends object>(
		section: string,
		key: string
	): Promise<T> {
		const entry = await this.prisma.contentEntry.findUnique({
			where: { section_key: { section, key } },
		});
		if (!entry) throw new NotFoundException('CONTENT_NOT_FOUND');
		return entry.data as T;
	}

	private costLine({ id, label, amount }: ContentItem<CostLineData>) {
		return { id, label, amount: toUsd(new Prisma.Decimal(amount)) };
	}

	async stats() {
		return { data: await this.items<StatData>(ContentSection.HOME_STATS) };
	}

	async howItWorks() {
		return {
			data: await this.items<StepData>(ContentSection.HOME_HOW_IT_WORKS),
		};
	}

	async faq() {
		return { data: await this.items<FaqData>(ContentSection.HOME_FAQ) };
	}

	async costExample() {
		const [lines, summary] = await Promise.all([
			this.items<CostLineData>(ContentSection.HOME_COST_LINES),
			this.items<CostLineData | CostFootnoteData>(
				ContentSection.HOME_COST_SUMMARY
			),
		]);
		const total = summary.find(({ id }) => id === ContentKey.COST_TOTAL);
		const footnote = summary.find(({ id }) => id === ContentKey.COST_FOOTNOTE);
		if (!total || !footnote) throw new NotFoundException('CONTENT_NOT_FOUND');
		return {
			data: {
				lines: lines.map((line) => this.costLine(line)),
				total: this.costLine(total as ContentItem<CostLineData>),
				footnote: (footnote as ContentItem<CostFootnoteData>).text,
			},
		};
	}

	async authBrand() {
		const [headline, benefits, metrics] = await Promise.all([
			this.item<BrandHeadlineData>(
				ContentSection.AUTH_BRAND,
				ContentKey.BRAND_HEADLINE
			),
			this.items<BenefitData>(ContentSection.AUTH_BENEFITS),
			this.items<MetricData>(ContentSection.AUTH_METRICS),
		]);
		return { data: { ...headline, benefits, metrics } };
	}
}
