export type MobileContent = {
	intro: string;
	content: string;
};

const rawMobile = import.meta.glob('../../../content/mobile/*.json', { eager: true });

const defaultContent: MobileContent = {
	intro: '',
	content: ''
};

const loadMobileContent = (): MobileContent => {
	const entry = Object.values(rawMobile)[0] as { default: Partial<MobileContent> } | undefined;
	const data = entry?.default ?? {};

	return {
		intro: typeof data.intro === 'string' ? data.intro : defaultContent.intro,
		content: typeof data.content === 'string' ? data.content : defaultContent.content
	};
};

export const getMobileContent = (): MobileContent => loadMobileContent();
