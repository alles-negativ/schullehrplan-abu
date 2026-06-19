<script lang="ts">
    import { browser } from "$app/environment";
    import pdfIcon from "$lib/assets/pdf-icon.svg";
    import { pillDragging } from "$lib/pill-dragging";

    let {
        href,
        label,
    }: {
        href: string;
        label: string;
    } = $props();

    let isDocked = $state(false);

    $effect(() => {
        if (!browser) return;

        let frame = 0;

        const update = () => {
            const footer = document.getElementById("site-footer");
            if (!footer) return;

            const footerTop = footer.getBoundingClientRect().top;
            // Dock when the footer reaches the viewport bottom so the
            // docked button (margin above footer) aligns with the fixed one.
            isDocked = footerTop <= window.innerHeight;
        };

        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        // The footer mounts after this component, so retry until it exists.
        const start = () => {
            if (document.getElementById("site-footer")) {
                update();
            } else {
                frame = requestAnimationFrame(start);
            }
        };
        start();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    });
</script>

<a
    class="pdf-link pdf-link--fixed"
    class:is-hidden={isDocked}
    class:is-inert={$pillDragging}
    {href}
    target="_blank"
    rel="noopener noreferrer"
>
    <img src={pdfIcon} alt="" class="pdf-icon" aria-hidden="true" />
    <span>{label}</span>
</a>

<a
    class="pdf-link pdf-link--docked"
    class:is-hidden={!isDocked}
    class:is-inert={$pillDragging}
    {href}
    target="_blank"
    rel="noopener noreferrer"
>
    <img src={pdfIcon} alt="" class="pdf-icon" aria-hidden="true" />
    <span>{label}</span>
</a>

<style>
    .pdf-link {
        display: inline-flex;
        align-items: center;
        gap: calc(7 * var(--u));
        width: fit-content;
        max-width: calc(100% - 60 * var(--u));
        box-sizing: border-box;
        padding: calc(3 * var(--u)) calc(15 * var(--u)) calc(3 * var(--u))
            calc(12 * var(--u));
        border-radius: 9999px;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        background: var(--color-white);
        color: var(--color-black);
        text-decoration: none;
        font-family: var(--font-sans);
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        transition:
            background-color 120ms ease,
            color 120ms ease;
        z-index: 10;
    }

    .pdf-link.is-hidden {
        visibility: hidden;
        pointer-events: none;
    }

    .pdf-link.is-inert {
        pointer-events: none;
    }

    .pdf-link--fixed {
        position: fixed;
        left: calc(30 * var(--u));
        bottom: calc(30 * var(--u));
    }

    .pdf-link--docked {
        position: absolute;
        left: calc(30 * var(--u));
        bottom: calc(30 * var(--u));
    }

    .pdf-link:hover {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .pdf-link:hover .pdf-icon {
        filter: invert(1);
    }

    .pdf-icon {
        flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .pdf-link {
            transition: none;
        }
    }
</style>
