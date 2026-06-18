import { getAllCompetences } from "$lib/data/education-modes";

const pickRandomCompetenceColor = (): string => {
    const colors = getAllCompetences()
        .map((competence) => competence.color)
        .filter((color): color is string => Boolean(color));

    return colors[Math.floor(Math.random() * colors.length)] ?? "#87E8F7";
};

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
