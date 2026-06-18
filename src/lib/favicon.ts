import { browser } from "$app/environment";
import { getAllCompetences } from "$lib/data/education-modes";

const pickRandomCompetenceColor = (): string => {
    const colors = getAllCompetences()
        .map((competence) => competence.color)
        .filter((color): color is string => Boolean(color));

    return colors[Math.floor(Math.random() * colors.length)] ?? "#87E8F7";
};

export const createDotFaviconDataUrl = (color: string): string => {
    if (browser) {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.beginPath();
            ctx.arc(16, 16, 16, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            return canvas.toDataURL("image/png");
        }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="${color}"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const getRandomCompetenceFavicon = (): string =>
    createDotFaviconDataUrl(pickRandomCompetenceColor());
