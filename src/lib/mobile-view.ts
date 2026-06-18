import { browser } from "$app/environment";

export const MOBILE_MAX_WIDTH_PX = 900;

export const mobileMediaQueryString = `(max-width: ${MOBILE_MAX_WIDTH_PX - 1}px)`;

export const isMobileViewport = (): boolean => {
    if (!browser) return false;
    return window.matchMedia(mobileMediaQueryString).matches;
};

export const watchMobileViewport = (
    onChange: (isMobile: boolean) => void,
): (() => void) => {
    if (!browser) return () => {};

    const mq = window.matchMedia(mobileMediaQueryString);
    let previous = mq.matches;

    onChange(previous);

    const handler = () => {
        const next = mq.matches;
        if (next !== previous) {
            window.location.reload();
            return;
        }
        onChange(next);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
};
