import { browser } from "$app/environment";

const MIN_DURATION_MS = 250;
const MAX_DURATION_MS = 650;

/**
 * Animates the window scroll to the top and resolves once it arrives.
 * Driven by requestAnimationFrame instead of native smooth scrolling,
 * because the browser can silently cancel a smooth scroll that starts
 * during a SvelteKit navigation (focus reset), which would leave the
 * page stuck mid-scroll.
 */
export const scrollToPageTop = (): Promise<void> => {
    if (!browser) return Promise.resolve();

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const startY = window.scrollY;

    if (prefersReducedMotion || startY <= 0) {
        window.scrollTo(0, 0);
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const duration = Math.min(
            MAX_DURATION_MS,
            Math.max(MIN_DURATION_MS, startY * 0.4),
        );
        const startTime = performance.now();
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        let cancelled = false;

        // If the user scrolls themselves, stop fighting them.
        const cancelEvents = ["wheel", "touchstart"] as const;
        const cancel = () => {
            cancelled = true;
            cleanup();
            resolve();
        };
        const cleanup = () => {
            for (const event of cancelEvents) {
                window.removeEventListener(event, cancel);
            }
        };
        for (const event of cancelEvents) {
            window.addEventListener(event, cancel, { passive: true });
        }

        const step = (now: number) => {
            if (cancelled) return;
            const t = Math.min(1, (now - startTime) / duration);
            window.scrollTo(0, Math.round(startY * (1 - easeOutCubic(t))));
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                cleanup();
                resolve();
            }
        };

        requestAnimationFrame(step);
    });
};
