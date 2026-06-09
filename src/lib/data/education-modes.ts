export type LearningContent = {
	title?: string;
	titel?: string;
	number?: number;
	social_aspects?: string[];
	language_aspects?: string[];
	essential_competences?: string[];
};

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

export const getCompetenceBySlug = (slug: string): Competence | undefined => competenceBySlug[slug];

export const getAllCompetences = (): Competence[] =>
	Object.values(competenceBySlug).sort((a, b) => a.title.localeCompare(b.title, 'de-CH'));

export const getAspectByTitle = (title: string): Aspect | undefined => aspectByTitle[title];
