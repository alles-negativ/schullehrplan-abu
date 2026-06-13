export type TopicMapTopic = {
	number: number;
	label: string;
	hover_color: string;
};

export type TopicMapAnnotation = {
	text: string;
};

export type TopicMapQv = {
	label: string;
	annotations: TopicMapAnnotation[];
};

export type TopicMapBubble = {
	title: string;
	text: string;
	side: 'left' | 'right';
	order: number;
	anchor_topic: number;
};

export type TopicMapConfig = {
	title: string;
	scroll_height_vh: number;
	topics: TopicMapTopic[];
	qv: TopicMapQv;
	bubbles: TopicMapBubble[];
};

const rawTopicMap = import.meta.glob('../../../content/topic_map/*.json', {
	eager: true
});

const defaultConfig: TopicMapConfig = {
	title: 'Aufbau des Themen-Schullehrplans',
	scroll_height_vh: 480,
	topics: Array.from({ length: 8 }, (_, index) => ({
		number: index + 1,
		label: `${index + 1}. Thema`,
		hover_color: '#E8E8E8'
	})),
	qv: {
		label: 'QV',
		annotations: []
	},
	bubbles: []
};

const loadTopicMapConfig = (): TopicMapConfig => {
	const entry = Object.values(rawTopicMap)[0] as { default: Partial<TopicMapConfig> } | undefined;
	const data = entry?.default ?? {};

	return {
		title: data.title ?? defaultConfig.title,
		scroll_height_vh: data.scroll_height_vh ?? defaultConfig.scroll_height_vh,
		topics: data.topics?.length ? data.topics : defaultConfig.topics,
		qv: {
			label: data.qv?.label ?? defaultConfig.qv.label,
			annotations: data.qv?.annotations ?? defaultConfig.qv.annotations
		},
		bubbles: data.bubbles ?? defaultConfig.bubbles
	};
};

export const getTopicMap = (): TopicMapConfig => loadTopicMapConfig();

export const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

/** True when the anchor's vertical center lies in the middle `centerFraction` of the viewport. */
export const isAnchorInViewportCenter = (
	anchorCenterY: number | undefined,
	viewportHeight: number,
	centerFraction = 0.5
): boolean => {
	if (anchorCenterY === undefined || viewportHeight <= 0) return false;

	const inset = (1 - centerFraction) / 2;
	const zoneTop = viewportHeight * inset;
	const zoneBottom = viewportHeight * (1 - inset);

	return anchorCenterY >= zoneTop && anchorCenterY <= zoneBottom;
};
