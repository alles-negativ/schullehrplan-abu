import { browser } from "$app/environment";

/**
 * Width the design is authored against. Mirrors the CSS `--u` scaled-pixel
 * unit in `app.css`: below this width the scale is 1, above it grows linearly.
 */
export const LAYOUT_BASE_WIDTH_PX = 1728;

export const getLayoutScale = (
    width = browser ? window.innerWidth : LAYOUT_BASE_WIDTH_PX,
): number => Math.max(1, width / LAYOUT_BASE_WIDTH_PX);
