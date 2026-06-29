export type StatementContent = {
	title: string;
	image: string;
	image_alt: string;
	lead: string;
	paragraphs: string[];
};

const rawStatement = import.meta.glob('../../../content/statement/*.json', { eager: true });

const defaultContent: StatementContent = {
	title: '',
	image: '',
	image_alt: '',
	lead: '',
	paragraphs: []
};

const loadStatementContent = (): StatementContent => {
	const entry = Object.values(rawStatement)[0] as
		| { default: Partial<StatementContent> }
		| undefined;
	const data = entry?.default ?? {};

	return {
		title: data.title ?? defaultContent.title,
		image: data.image ?? defaultContent.image,
		image_alt: data.image_alt ?? defaultContent.image_alt,
		lead: data.lead ?? defaultContent.lead,
		paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : defaultContent.paragraphs
	};
};

export const getStatementContent = (): StatementContent => loadStatementContent();
