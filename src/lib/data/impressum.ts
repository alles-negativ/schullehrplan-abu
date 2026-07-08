export type ImpressumContent = {
	title: string;
	content: string;
	content_before_image?: string;
	content_after_image?: string;
	image?: string;
	image_alt?: string;
	image_caption?: string;
};

const rawImpressum = import.meta.glob('../../../content/impressum/*.json', { eager: true });

const defaultContent: ImpressumContent = {
	title: 'Impressum',
	content: ''
};

const IMAGE_MARKER = '[IMAGE HERE]';

const loadImpressumContent = (): ImpressumContent => {
	const entry = Object.values(rawImpressum)[0] as { default: Partial<ImpressumContent> } | undefined;
	const data = entry?.default ?? {};
	const content = typeof data.content === 'string' ? data.content : defaultContent.content;
	const markerIndex = content.indexOf(IMAGE_MARKER);
	const hasSplitContent = data.image && markerIndex >= 0;

	return {
		title: data.title ?? defaultContent.title,
		content,
		content_before_image: hasSplitContent
			? content.slice(0, markerIndex).trimEnd()
			: undefined,
		content_after_image: hasSplitContent
			? content.slice(markerIndex + IMAGE_MARKER.length).trimStart()
			: undefined,
		image: data.image,
		image_alt: data.image_alt,
		image_caption: data.image_caption
	};
};

export const getImpressumContent = (): ImpressumContent => loadImpressumContent();
