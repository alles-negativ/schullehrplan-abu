export type QvTableRow = {
	label: string;
	description: string;
};

export type QvTable = {
	caption?: string;
	column_label?: string;
	column_description?: string;
	rows: QvTableRow[];
};

export type QvList = {
	title?: string;
	items: string[];
};

const normalizeListItems = (items: unknown): string[] => {
	if (!Array.isArray(items)) return [];

	return items
		.map((item) => {
			if (typeof item === 'string') return item;
			if (item && typeof item === 'object' && 'text' in item) {
				return String((item as { text: unknown }).text ?? '');
			}
			return '';
		})
		.filter(Boolean);
};

const normalizeLists = (lists: unknown): QvList[] => {
	if (!Array.isArray(lists)) return [];

	return lists.map((list) => {
		if (!list || typeof list !== 'object') return { items: [] };

		const entry = list as { title?: string; items?: unknown };
		return {
			title: entry.title,
			items: normalizeListItems(entry.items)
		};
	});
};

export type QvSubsection = {
	number?: string;
	title: string;
	body?: string;
};

export type QvSection = {
	number?: string;
	title: string;
	body?: string;
	subsections?: QvSubsection[];
	tables?: QvTable[];
	lists?: QvList[];
};

export type QvChapter = {
	number: number;
	title: string;
	intro?: string;
	sections: QvSection[];
};

export type QvContent = {
	title: string;
	chapters: QvChapter[];
};

const rawQv = import.meta.glob('../../../content/qv/*.json', { eager: true });

const defaultContent: QvContent = {
	title: 'Qualifikationsverfahren',
	chapters: []
};

const normalizeSection = (section: Partial<QvSection>): QvSection => ({
	number: section.number,
	title: section.title ?? '',
	body: section.body,
	subsections: section.subsections,
	tables: section.tables,
	lists: normalizeLists(section.lists)
});

const normalizeChapter = (chapter: Partial<QvChapter>): QvChapter => ({
	number: chapter.number ?? 0,
	title: chapter.title ?? '',
	intro: chapter.intro,
	sections: (chapter.sections ?? []).map((section) => normalizeSection(section))
});

const loadQvContent = (): QvContent => {
	const entry = Object.values(rawQv)[0] as { default: Partial<QvContent> } | undefined;
	const data = entry?.default ?? {};

	return {
		title: data.title ?? defaultContent.title,
		chapters: (data.chapters ?? defaultContent.chapters).map((chapter) =>
			normalizeChapter(chapter)
		)
	};
};

export const getQvContent = (): QvContent => loadQvContent();

export const getQvChapterLabel = (chapter: QvChapter): string =>
	`${chapter.number}. ${chapter.title}`;

export const getQvSectionLabel = (section: QvSection): string =>
	section.number ? `${section.number} ${section.title}` : section.title;
