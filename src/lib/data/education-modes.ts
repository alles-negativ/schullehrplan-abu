export type AspectReference = {
	aspect: string;
	specification?: string;
};

export type LearningContent = {
	title?: string;
	titel?: string;
	number?: number;
	location?: string;
	social_aspects?: AspectReference[];
	language_aspects?: AspectReference[];
	essential_competences?: string[];
};

export const getAspectSlug = (entry: string | AspectReference): string =>
	typeof entry === 'string' ? entry : entry.aspect;

export const getAspectSpecification = (entry: string | AspectReference): string | undefined =>
	typeof entry === 'string' ? undefined : entry.specification;

export type IndividualReference = {
	title?: string;
	titel?: string;
	number?: number;
	lessons?: number;
	essential_competences?: string[];
	learning_contents?: LearningContent[];
};

export type Topic = {
	title?: string;
	titel?: string;
	description?: string;
	beschreibung?: string;
	body?: string;
	additional_description?: string;
	detaillierte_erweiterung?: string;
	kerninhalte?: string;
	core_contents?: string;
	number?: number;
	lessons?: number;
	essential_competences?: string[];
	individual_reference?: IndividualReference[];
	min_social_aspects?: number;
	min_language_modes?: number;
	min_key_competences?: number;
};

export type YearEntry = {
	year?: number | string;
	jahr?: number | string;
	additional_lessons?: number;
	themenbereiche?: Topic[];
};

export type EducationMode = {
	title: string;
	slug: string;
	overview?: string;
	implementation_examples_pdf?: string;
	years?: YearEntry[];
	lehrjahre?: YearEntry[];
};

export type Competence = {
	slug: string;
	title: string;
	description?: string;
	color?: string;
	aspect?: string;
};

export type Aspect = {
	slug: string;
	title: string;
	description?: string;
	color?: string;
};

const rawModules = import.meta.glob('../../../content/education_modes/*.json', {
	eager: true
});

const rawCompetenceModules = import.meta.glob('../../../content/competences/*.json', {
	eager: true
});

const rawAspectModules = import.meta.glob('../../../content/aspects/*.json', {
	eager: true
});

const competenceBySlug: Record<string, Competence> = Object.fromEntries(
	Object.entries(rawCompetenceModules).map(([path, mod]) => {
		const data = (mod as { default: Partial<Competence> }).default ?? {};
		const slug = path.split('/').pop()?.replace('.json', '') ?? '';
		return [
			slug,
			{
				slug,
				title: data.title ?? slug,
				description: data.description,
				color: data.color,
				aspect: data.aspect
			}
		];
	})
);

const aspectByTitle: Record<string, Aspect> = Object.fromEntries(
	Object.entries(rawAspectModules).map(([path, mod]) => {
		const data = (mod as { default: Partial<Aspect> }).default ?? {};
		const slug = path.split('/').pop()?.replace('.json', '') ?? '';
		const title = data.title ?? slug;
		return [
			title,
			{
				slug,
				title,
				description: data.description,
				color: data.color
			}
		];
	})
);

export const getAllEducationModes = (): EducationMode[] =>
	Object.entries(rawModules)
		.map(([path, mod]) => {
			const data = (mod as { default: Partial<EducationMode> }).default ?? {};
			const slug = path.split('/').pop()?.replace('.json', '') ?? '';

			return {
				title: data.title ?? slug,
				slug,
				overview: data.overview,
				implementation_examples_pdf: data.implementation_examples_pdf,
				years: data.years,
				lehrjahre: data.lehrjahre
			};
		})
		.sort((a, b) => a.title.localeCompare(b.title, 'de-CH'));

export const getEducationModeBySlug = (slug: string): EducationMode | undefined =>
	getAllEducationModes().find((mode) => mode.slug === slug);

export const getModeYears = (mode: EducationMode): YearEntry[] => mode.years ?? mode.lehrjahre ?? [];

export const getYearLabel = (year: YearEntry): string => String(year.year ?? year.jahr ?? '-');

export const getTopicTitle = (topic: Topic): string => topic.title ?? topic.titel ?? 'Ohne Titel';

export const getTopicDescription = (topic: Topic): string | undefined =>
	topic.description ?? topic.beschreibung ?? topic.body;

export const getAdditionalTopicDescription = (topic: Topic): string | undefined =>
	topic.additional_description ?? topic.detaillierte_erweiterung;

export const getTopicCoreContents = (topic: Topic): string | undefined =>
	topic.kerninhalte ?? topic.core_contents;

const getIndividualReferenceLessons = (topic: Topic): number =>
	(topic.individual_reference ?? []).reduce((sum, reference) => sum + (reference.lessons ?? 0), 0);

export const getTopicLessons = (topic: Topic): number =>
	topic.lessons != null ? topic.lessons : getIndividualReferenceLessons(topic);

export const getYearLessons = (year: YearEntry): number => {
	const topicLessons = (year.themenbereiche ?? []).reduce(
		(sum, topic) => sum + getTopicLessons(topic),
		0
	);
	return topicLessons + (year.additional_lessons ?? 0);
};

export const getCompetenceBySlug = (slug: string): Competence | undefined => competenceBySlug[slug];

export const getAllCompetences = (): Competence[] =>
	Object.values(competenceBySlug).sort((a, b) => a.title.localeCompare(b.title, 'de-CH'));

export const getAspectByTitle = (title: string): Aspect | undefined => aspectByTitle[title];

const aspectDisplayOrder = [
	'Gesellschaftliche Inhalte',
	'Sprachmodi',
	'Schlüsselkompetenzen'
] as const;

export const getAllAspects = (): Aspect[] =>
	aspectDisplayOrder
		.map((title) => aspectByTitle[title])
		.filter((aspect): aspect is Aspect => Boolean(aspect));

export const getModeCompetenceCounts = (mode: EducationMode): Map<string, number> => {
	const counts = new Map<string, number>();
	const addSlug = (slug: string) => counts.set(slug, (counts.get(slug) ?? 0) + 1);

	for (const year of getModeYears(mode)) {
		for (const topic of year.themenbereiche ?? []) {
			for (const slug of topic.essential_competences ?? []) addSlug(slug);
			for (const ref of topic.individual_reference ?? []) {
				for (const slug of ref.essential_competences ?? []) addSlug(slug);
				for (const content of ref.learning_contents ?? []) {
					for (const entry of content.social_aspects ?? []) addSlug(getAspectSlug(entry));
					for (const entry of content.language_aspects ?? []) addSlug(getAspectSlug(entry));
					for (const slug of content.essential_competences ?? []) addSlug(slug);
				}
			}
		}
	}

	return counts;
};
