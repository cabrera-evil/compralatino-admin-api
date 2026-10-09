export type ContentItem<T> = { id: string } & T;

export type StatData = { value: string; label: string };
export type StepData = { title: string; description: string; icon: string };
export type CostLineData = { label: string; amount: string };
export type CostFootnoteData = { text: string };
export type FaqData = { question: string; answer: string };
export type BrandHeadlineData = {
	badge: string;
	title: string;
	titleAccent: string;
	description: string;
};
export type BenefitData = {
	icon: string;
	title: string;
	description: string;
	highlight: string;
	highlightIcon: string;
};
export type MetricData = { value: string; label: string };
