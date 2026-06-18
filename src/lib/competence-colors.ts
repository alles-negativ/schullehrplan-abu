import { getAllCompetences } from "$lib/data/education-modes";

export const getCompetenceColors = (): string[] =>
    getAllCompetences()
        .map((competence) => competence.color)
        .filter((color): color is string => Boolean(color));

export const pickRandomCompetenceColor = (exclude?: string): string => {
    const colors = getCompetenceColors();
    if (!colors.length) return "#87E8F7";

    const pool =
        exclude && colors.length > 1
            ? colors.filter((color) => color !== exclude)
            : colors;

    return pool[Math.floor(Math.random() * pool.length)] ?? colors[0];
};
