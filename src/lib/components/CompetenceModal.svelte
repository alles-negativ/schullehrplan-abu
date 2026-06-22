<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { marked } from "marked";
    import closeIcon from "$lib/assets/close-icon.svg";
    import type { Competence } from "$lib/data/education-modes";

    const FADE_MS = 280;
    const SLIDE_MS = 400;
    const SLIDE_DELAY_MS = 100;

    let {
        competence = $bindable<Competence | null>(null),
    }: {
        competence?: Competence | null;
    } = $props();

    let reducedMotion = $state(false);

    onMount(() => {
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        reducedMotion = motionQuery.matches;

        const onMotionChange = (event: MediaQueryListEvent) => {
            reducedMotion = event.matches;
        };

        motionQuery.addEventListener("change", onMotionChange);
        return () => motionQuery.removeEventListener("change", onMotionChange);
    });

    const close = () => {
        competence = null;
    };

    const onBackdropKeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") close();
    };

    const onBackdropClick = (event: MouseEvent) => {
        if (event.target === event.currentTarget) close();
    };
</script>

{#if competence}
    <div
        class="modal-backdrop"
        role="button"
        tabindex="0"
        aria-label="Kompetenz-Dialog schliessen"
        transition:fade={{ duration: reducedMotion ? 0 : FADE_MS }}
        onclick={onBackdropClick}
        onkeydown={onBackdropKeydown}
    >
        <div
            class="modal-card"
            class:modal-enter-slide={!reducedMotion}
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            aria-label={`Kompetenz: ${competence.title}`}
            style={`--modal-color: ${competence.color ?? "#334155"};${!reducedMotion ? ` --modal-enter-delay: ${SLIDE_DELAY_MS}ms; --modal-slide-duration: ${SLIDE_MS}ms;` : ""}`}
        >
            <button
                class="modal-close"
                type="button"
                aria-label="Schliessen"
                onclick={close}
            >
                <img src={closeIcon} alt="" class="modal-close-icon" />
            </button>
            {#if competence.aspect}
                <p class="modal-aspect">{competence.aspect}</p>
            {/if}
            <h2>{competence.title}</h2>
            {#if competence.description}
                <div class="modal-description">
                    {@html marked.parse(competence.description) as string}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: calc(30 * var(--u));
        z-index: 1000;
        border: 0;
        width: 100%;
        text-align: initial;
    }

    .modal-card {
        position: relative;
        width: min(calc(800 * var(--u)), 100%);
        padding: calc(30 * var(--u)) calc(30 * var(--u)) calc(30 * var(--u))
            calc(30 * var(--u));
        border-radius: calc(25 * var(--u));
        border: calc(1.5 * var(--u)) solid var(--color-black);
        background: var(--modal-color);
        box-shadow: 0 calc(12 * var(--u)) calc(30 * var(--u))
            rgba(0, 0, 0, 0.25);
    }

    .modal-card.modal-enter-slide {
        animation: modal-slide-in var(--modal-slide-duration, 400ms)
            var(--modal-enter-delay, 0ms) ease-out both;
    }

    @keyframes modal-slide-in {
        from {
            transform: translateY(calc(-80 * var(--u)));
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-close {
        position: absolute;
        top: calc(23 * var(--u));
        right: calc(21 * var(--u));
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        width: calc(52 * var(--u));
        height: calc(52 * var(--u));
        display: inline-grid;
        place-items: center;
        background: var(--color-darkblue);
        padding: 0;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            brightness 60ms ease;
    }

    .modal-close:hover {
        filter: brightness(1.2);
    }

    .modal-close-icon {
        width: calc(22 * var(--u));
        height: calc(22 * var(--u));
        display: block;
    }

    .modal-aspect {
        margin-bottom: calc(20 * var(--u));
        color: var(--color-black);
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
    }

    .modal-description :global(p) {
        margin: 0.5rem 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .modal-card.modal-enter-slide {
            animation: none;
        }
    }
</style>
