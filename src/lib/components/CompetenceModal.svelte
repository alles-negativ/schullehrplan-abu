<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { marked } from "marked";
    import closeIcon from "$lib/assets/close-icon.svg";
    import type { Competence } from "$lib/data/education-modes";

    const FADE_MS = 280;
    const SHAKE_DELAY_MS = 100;

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
            class:modal-enter-shake={!reducedMotion}
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            aria-label={`Kompetenz: ${competence.title}`}
            style={`--modal-color: ${competence.color ?? "#334155"};${!reducedMotion ? ` --modal-shake-delay: ${SHAKE_DELAY_MS}ms;` : ""}`}
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
        padding: 30px;
        z-index: 1000;
        border: 0;
        width: 100%;
        text-align: initial;
    }

    .modal-card {
        position: relative;
        width: min(800px, 100%);
        padding: 30px 30px 30px 30px;
        border-radius: 25px;
        border: 1.5px solid var(--color-black);
        background: var(--modal-color);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    .modal-card.modal-enter-shake {
        animation: modal-shake-hack 0.8s var(--modal-shake-delay) ease-in-out;
    }

    @keyframes modal-shake-hack {
        0%,
        50%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        10% {
            transform: rotate(-1deg) translateX(-10px);
        }
        20% {
            transform: rotate(1deg) translateX(10px);
        }
        30% {
            transform: rotate(-0.75deg) translateX(-10px);
        }
        40% {
            transform: rotate(0.75deg) translateX(10px);
        }
    }

    .modal-close {
        position: absolute;
        top: 23px;
        right: 21px;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        width: 52px;
        height: 52px;
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
        width: 22px;
        height: 22px;
        display: block;
    }

    .modal-aspect {
        margin-bottom: 20px;
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
        .modal-card.modal-enter-shake {
            animation: none;
        }
    }
</style>
