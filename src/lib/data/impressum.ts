export type ImpressumContent = {
	title: string;
	content: string;
	image?: string;
	image_alt?: string;
	image_caption?: string;
};

const rawImpressum = import.meta.glob('../../../content/impressum/*.json', { eager: true });

const defaultContent: ImpressumContent = {
	title: 'Impressum',
	content: ''
};

const loadImpressumContent = (): ImpressumContent => {
	const entry = Object.values(rawImpressum)[0] as { default: Partial<ImpressumContent> } | undefined;
	const data = entry?.default ?? {};

	return {
		title: data.title ?? defaultContent.title,
		content: typeof data.content === 'string' ? data.content : defaultContent.content,
		image: data.image,
		image_alt: data.image_alt,
		image_caption: data.image_caption
	};
};

export const getImpressumContent = (): ImpressumContent => loadImpressumContent();
