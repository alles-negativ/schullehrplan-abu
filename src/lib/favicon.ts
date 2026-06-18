import { pickRandomCompetenceColor } from "$lib/competence-colors";

export const colorToFaviconId = (color: string): string =>
    color.replace("#", "").toUpperCase();

export const getFaviconHref = (color: string, size: 32 | 180 = 32): string =>
    `/favicons/${size}/${colorToFaviconId(color)}.png`;

export const getRandomCompetenceFaviconHrefs = (): {
    icon: string;
    appleTouchIcon: string;
} => {
    const color = pickRandomCompetenceColor();
    return {
        icon: getFaviconHref(color, 32),
        appleTouchIcon: getFaviconHref(color, 180),
    };
};
