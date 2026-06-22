import { browser } from "$app/environment";

/** Viewport width the mobile UI is authored against. */
export const MOBILE_DESIGN_WIDTH_PX = 400;

/** Viewport width above which `--mobile-scale` stops growing. */
export const MOBILE_SCALE_MAX_WIDTH_PX = 700;

/**
 * Linear scale from {@link MOBILE_DESIGN_WIDTH_PX}, capped at
 * {@link MOBILE_SCALE_MAX_WIDTH_PX}. Mirrors the CSS `--mobile-scale` unit on
 * `.mobile-experience`.
 */
export const getMobileScale = (
    width = browser ? window.innerWidth : MOBILE_DESIGN_WIDTH_PX,
): number =>
    Math.min(
        MOBILE_SCALE_MAX_WIDTH_PX / MOBILE_DESIGN_WIDTH_PX,
        width / MOBILE_DESIGN_WIDTH_PX,
    );
