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

export type QvSubsection = {
	number?: string;
	title: string;
	body?: string;
	table?: QvTable;
	flex_table?: QvChapterTable;
};

export type QvSection = {
	number?: string;
	title: string;
	body?: string;
	subsections?: QvSubsection[];
	table?: QvTable;
	flex_table?: QvChapterTable;
};

export type QvChapterTable = {
	caption?: string;
	columns: string[];
	rows: string[][];
};

export type QvChapter = {
	number?: number;
	title: string;
	intro?: string;
	tables?: QvChapterTable[];
	additional_content?: string;
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

const normalizeSubsection = (sub: Partial<QvSubsection>): QvSubsection => ({
	number: sub.number,
	title: sub.title ?? '',
	body: sub.body,
	table: sub.table,
	flex_table: sub.flex_table ? (normalizeChapterTable(sub.flex_table) ?? undefined) : undefined
});

const normalizeSection = (section: Partial<QvSection>): QvSection => ({
	number: section.number,
	title: section.title ?? '',
	body: section.body,
	subsections: Array.isArray(section.subsections)
		? section.subsections.map((s) => normalizeSubsection(s))
		: undefined,
	table: section.table,
	flex_table: section.flex_table ? (normalizeChapterTable(section.flex_table) ?? undefined) : undefined
});

const normalizeChapterTable = (table: unknown): QvChapterTable | null => {
	if (!table || typeof table !== 'object') return null;
	const t = table as { caption?: string; columns?: unknown; rows?: unknown };
	const columns = Array.isArray(t.columns) ? t.columns.map(String) : [];
	const rows = Array.isArray(t.rows)
		? t.rows.map((row) => (Array.isArray(row) ? row.map(String) : []))
		: [];
	return { caption: t.caption, columns, rows };
};

const normalizeChapter = (chapter: Partial<QvChapter>): QvChapter => ({
	number: chapter.number,
	title: chapter.title ?? '',
	intro: typeof chapter.intro === 'string' ? chapter.intro : undefined,
	tables: Array.isArray(chapter.tables)
		? chapter.tables.map(normalizeChapterTable).filter((t): t is QvChapterTable => t !== null)
		: undefined,
	additional_content: typeof chapter.additional_content === 'string' ? chapter.additional_content : undefined,
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
	chapter.number != null ? `${chapter.number}. ${chapter.title}` : chapter.title;

export const getQvSectionLabel = (section: QvSection): string =>
	section.number ? `${section.number} ${section.title}` : section.title;
