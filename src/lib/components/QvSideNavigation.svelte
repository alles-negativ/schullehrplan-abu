<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import arrowIcon from "$lib/assets/arrow.svg";
    import pdfIcon from "$lib/assets/pdf-icon.svg";
    import type { QvChapter } from "$lib/data/qv";

    const DROPDOWN_MEDIA = "(max-width: 1100px)";
    const DROPDOWN_FADE_MS = 280;
    const DROPDOWN_SLIDE_MS = 220;
    let {
        chapters,
        ebaToEfzPdf,
        selectedChapterIndex = -1,
        expanded = false,
        getChapterHref,
    }: {
        chapters: QvChapter[];
        ebaToEfzPdf?: string;
        selectedChapterIndex?: number;
        expanded?: boolean;
        getChapterHref: (chapterIndex: number) => string;
    } = $props();

    let isNarrowViewport = $state(
        browser ? window.matchMedia(DROPDOWN_MEDIA).matches : false,
    );
    let dropdownOpen = $state(false);
    let dropdownExpanded = $state(false);
    let dropdownRootElement = $state<HTMLDivElement | null>(null);
    let reducedMotion = $state(false);

    const useDropdown = $derived(isNarrowViewport && !expanded);

    const openDropdown = () => {
        dropdownOpen = true;
        dropdownExpanded = true;
    };

    const closeDropdown = () => {
        if (!dropdownOpen) return;
        dropdownOpen = false;
    };

    const onPanelOutroEnd = () => {
        dropdownExpanded = false;
    };

    const toggleDropdown = () => {
        if (dropdownOpen) closeDropdown();
        else openDropdown();
    };

    const onChapterNavigate = () => {
        if (useDropdown) closeDropdown();
    };

    onMount(() => {
        const mq = window.matchMedia(DROPDOWN_MEDIA);
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        reducedMotion = motionQuery.matches;

        const syncViewport = () => {
            isNarrowViewport = mq.matches;
            if (mq.matches) dropdownOpen = false;
        };

        const onMotionChange = (event: MediaQueryListEvent) => {
            reducedMotion = event.matches;
        };

        syncViewport();
        mq.addEventListener("change", syncViewport);
        motionQuery.addEventListener("change", onMotionChange);
        return () => {
            mq.removeEventListener("change", syncViewport);
            motionQuery.removeEventListener("change", onMotionChange);
        };
    });

    $effect(() => {
        if (expanded) {
            dropdownOpen = false;
            dropdownExpanded = false;
        }
    });

    $effect(() => {
        if (!useDropdown) {
            dropdownOpen = false;
            dropdownExpanded = false;
        }
    });

    $effect(() => {
        if (!browser || !useDropdown || !dropdownOpen) return;

        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeDropdown();
        };

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (dropdownRootElement?.contains(target)) return;
            closeDropdown();
        };

        document.addEventListener("keydown", onKeydown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeydown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    });
</script>

{#snippet navigationContent()}
    <nav aria-label="QV-Kapitel">
        <ul class="topic-list">
            {#each chapters as chapter, chapterIndex}
                <li>
                    <a
                        class="topic-button"
                        class:is-active={selectedChapterIndex === chapterIndex}
                        href={getChapterHref(chapterIndex)}
                        data-sveltekit-noscroll
                        onclick={onChapterNavigate}
                        aria-current={selectedChapterIndex === chapterIndex
                            ? "page"
                            : undefined}
                    >
                        <span class="topic-label">
                            {#if chapter.number != null}
                                <span>{chapter.number}. </span>
                            {/if}
                            <span>{chapter.title}</span>
                        </span>
                    </a>
                </li>
            {/each}
        </ul>
    </nav>

    {#if ebaToEfzPdf}
        <a
            class="pdf-link"
            href={ebaToEfzPdf}
            target="_blank"
            rel="noopener noreferrer"
        >
            <img src={pdfIcon} alt="" class="pdf-icon" aria-hidden="true" />
            <span>Übertritt EBA zu EFZ</span>
        </a>
    {/if}
{/snippet}

{#if useDropdown}
    <div class="side-navigation is-dropdown" bind:this={dropdownRootElement}>
        <div
            class="topic-dropdown"
            class:is-open={dropdownExpanded}
            in:fade={{
                duration: reducedMotion ? 0 : DROPDOWN_FADE_MS,
            }}
        >
            <button
                type="button"
                class="topic-dropdown-trigger"
                aria-expanded={dropdownOpen}
                aria-controls="qv-side-navigation-panel"
                onclick={toggleDropdown}
            >
                <span class="topic-label">Kapitelübersicht</span>
                <img
                    src={arrowIcon}
                    alt=""
                    class="topic-dropdown-icon"
                    aria-hidden="true"
                />
            </button>

            {#if dropdownOpen}
                <div
                    id="qv-side-navigation-panel"
                    class="topic-dropdown-panel"
                    transition:slide={{
                        duration: reducedMotion ? 0 : DROPDOWN_SLIDE_MS,
                        easing: (t) => t * (2 - t),
                    }}
                    onoutroend={onPanelOutroEnd}
                >
                    {@render navigationContent()}
                </div>
            {/if}
        </div>
    </div>
{:else}
    <aside
        id="qv-side-navigation-panel"
        class="side-navigation"
        class:is-expanded={expanded}
    >
        {@render navigationContent()}
    </aside>
{/if}

<style>
    .side-navigation {
        display: flex;
        flex-direction: column;
        gap: calc(50 * var(--u));
        min-width: 0;
        position: relative;
    }

    .side-navigation.is-dropdown {
        gap: 0;
        width: 100%;
    }

    .topic-dropdown {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: calc(27.5 * var(--u));
        background: var(--color-white);
        overflow: hidden;
        transition: background-color 120ms ease;
    }

    .topic-dropdown:not(.is-open) {
        height: calc(55 * var(--u));
    }

    .topic-dropdown.is-open {
        background: var(--color-darkblue);
        border-color: var(--color-black);
        color: var(--color-white);
    }

    .topic-dropdown:not(.is-open):hover {
        background: var(--color-darkblue);
    }

    .topic-dropdown:not(.is-open):hover .topic-dropdown-trigger {
        color: var(--color-white);
        background: transparent;
    }

    .topic-dropdown:not(.is-open):hover .topic-dropdown-icon {
        filter: brightness(0) invert(1);
    }

    .topic-dropdown-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(10 * var(--u));
        width: 100%;
        max-width: none;
        height: 100%;
        min-height: 0;
        flex-shrink: 0;
        box-sizing: border-box;
        padding: calc(7 * var(--u)) calc(14 * var(--u)) calc(7 * var(--u))
            calc(25 * var(--u));
        border: none;
        border-radius: 0;
        background: transparent;
        color: var(--color-black);
        cursor: pointer;
        text-align: left;
        font-family: var(--font-sans);
        font-size: calc(32 * var(--u));
        line-height: calc(40 * var(--u));
        font-weight: 400;
        letter-spacing: 0.01em;
        transition:
            background-color 120ms ease,
            color 120ms ease,
            filter 60ms ease;
    }

    .topic-dropdown-trigger .topic-label {
        flex: 1 1 auto;
        min-width: 0;
    }

    .topic-dropdown.is-open .topic-dropdown-trigger {
        height: calc(52 * var(--u));
        min-height: calc(52 * var(--u));
        background: var(--color-darkblue);
        color: var(--color-white);
        border-radius: 9999px;
    }

    .topic-dropdown.is-open .topic-dropdown-trigger .topic-dropdown-icon {
        filter: brightness(0) invert(1);
    }

    .topic-dropdown.is-open .topic-button {
        color: var(--color-white);
        border-color: var(--color-white);
        background: transparent;
    }

    .topic-dropdown.is-open .topic-button:hover,
    .topic-dropdown.is-open .topic-button.is-active {
        background: var(--color-white);
        color: var(--color-darkblue);
    }

    .topic-dropdown-icon {
        flex-shrink: 0;
        align-self: center;
        height: calc(30 * var(--u));
        width: auto;
        display: block;
        transform: rotate(180deg);
        filter: brightness(0);
        transition:
            transform 120ms ease,
            filter 120ms ease;
    }

    .topic-dropdown.is-open .topic-dropdown-icon {
        transform: rotate(0deg);
    }

    .topic-dropdown:not(.is-open)
        .topic-dropdown-trigger:hover
        .topic-dropdown-icon {
        filter: brightness(0) invert(1);
    }

    .topic-dropdown-panel {
        display: flex;
        flex-direction: column;
        gap: calc(50 * var(--u));
        padding: calc(30 * var(--u)) calc(15 * var(--u)) calc(15 * var(--u));
    }

    .topic-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: calc(6 * var(--u));
    }

    .topic-button {
        display: inline-flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 0;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        text-align: left;
        padding: calc(3 * var(--u)) calc(15 * var(--u));
        border-radius: 9999px;
        cursor: pointer;
        text-decoration: none;
        font-family: var(--font-sans);
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
        color: var(--color-black);
        border: calc(1.5 * var(--u)) solid var(--color-black);
        background: var(--color-white);
        transition:
            background-color 120ms ease,
            color 120ms ease,
            border-color 120ms ease,
            filter 60ms ease;
    }

    .topic-label {
        flex: 1 1 auto;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .topic-button:hover,
    .topic-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .topic-button.is-active:hover {
        filter: brightness(1.2);
    }

    .pdf-link {
        display: inline-flex;
        align-items: center;
        gap: calc(7 * var(--u));
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        margin-top: calc(10 * var(--u));
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
        .topic-dropdown,
        .topic-dropdown-icon,
        .topic-button,
        .pdf-link {
            transition: none;
        }
    }
</style>
