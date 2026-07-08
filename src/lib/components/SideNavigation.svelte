<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import arrowIcon from "$lib/assets/arrow.svg";
    import pdfIcon from "$lib/assets/pdf-icon.svg";
    import {
        getModeYears,
        getTopicLessons,
        getTopicTitle,
        getYearLabel,
        getYearLessons,
        type EducationMode,
    } from "$lib/data/education-modes";

    const LESSONS_STORAGE_KEY = "abu-show-lessons";
    const DROPDOWN_MEDIA = "(max-width: 1100px)";
    const DROPDOWN_FADE_MS = 280;
    const DROPDOWN_SLIDE_MS = 220;

    let {
        mode,
        selectedTopicKey,
        expanded = false,
        getTopicHref,
    }: {
        mode: EducationMode;
        selectedTopicKey?: string;
        expanded?: boolean;
        getTopicHref: (yearIndex: number, topicIndex: number) => string;
    } = $props();

    let showLessons = $state(true);
    let lessonsReady = $state(false);
    let isNarrowViewport = $state(
        browser ? window.matchMedia(DROPDOWN_MEDIA).matches : false,
    );
    let dropdownOpen = $state(false);
    let dropdownExpanded = $state(false);
    let dropdownRootElement = $state<HTMLDivElement | null>(null);
    let reducedMotion = $state(false);

    const useDropdown = $derived(isNarrowViewport && !expanded);

    if (browser) {
        const stored = localStorage.getItem(LESSONS_STORAGE_KEY);
        showLessons = stored === null ? true : stored === "true";
        lessonsReady = true;
    }

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

    const onTopicNavigate = () => {
        if (useDropdown) closeDropdown();
    };

    const toggleLessons = () => {
        showLessons = !showLessons;
        if (browser) {
            localStorage.setItem(LESSONS_STORAGE_KEY, String(showLessons));
        }
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
    <div class="lessons-toggle">
        <span class="lessons-toggle-label">Lektionen einblenden</span>
        <button
            type="button"
            role="switch"
            aria-checked={showLessons}
            aria-label={showLessons
                ? "Lektionen ausblenden"
                : "Lektionen einblenden"}
            class="toggle-switch"
            class:is-on={showLessons}
            onclick={toggleLessons}
        >
            <span class="toggle-thumb"></span>
        </button>
    </div>

    {#if getModeYears(mode).length === 0}
        <p>Keine Lehrjahre definiert.</p>
    {:else}
        {#each getModeYears(mode) as year, yearIndex}
            {@const yearLessons = getYearLessons(year)}
            <section>
                <h5 class="year-title">
                    <span>{getYearLabel(year)}. Lehrjahr</span>
                    {#if yearLessons > 0}
                        <span class="lesson-count">{yearLessons}</span>
                    {/if}
                </h5>
                {#if (year.themenbereiche?.length ?? 0) === 0}
                    <p>Keine Themenbereiche definiert.</p>
                {:else}
                    <ul class="topic-list">
                        {#each year.themenbereiche ?? [] as topic, topicIndex}
                            {@const topicLessons = getTopicLessons(topic)}
                            <li>
                                <a
                                    class="topic-button"
                                    class:is-active={selectedTopicKey ===
                                        `${yearIndex}-${topicIndex}`}
                                    href={getTopicHref(yearIndex, topicIndex)}
                                    data-sveltekit-noscroll
                                    onclick={onTopicNavigate}
                                    aria-current={selectedTopicKey ===
                                    `${yearIndex}-${topicIndex}`
                                        ? "true"
                                        : undefined}
                                >
                                    <span class="topic-label">
                                        {#if topic.number != null}
                                            <span>{topic.number}. </span>
                                        {/if}
                                        <span>{getTopicTitle(topic)}</span>
                                    </span>
                                    {#if topicLessons > 0}
                                        <span class="topic-lessons"
                                            >{topicLessons}</span
                                        >
                                    {/if}
                                </a>
                            </li>
                        {/each}
                        {#if year.additional_lessons != null}
                            <li class="year-meta">
                                <span>Weitere Lektionen</span>
                                <span>{year.additional_lessons}</span>
                            </li>
                        {/if}
                    </ul>
                {/if}
            </section>
        {/each}
    {/if}

    {#if mode.implementation_examples_pdf}
        <a
            class="pdf-link"
            href={mode.implementation_examples_pdf}
            target="_blank"
            rel="noopener noreferrer"
        >
            <img src={pdfIcon} alt="" class="pdf-icon" aria-hidden="true" />
            <span>Umsetzungsbeispiele</span>
        </a>
    {/if}
{/snippet}

{#if lessonsReady}
    {#if useDropdown}
        <div
            class="side-navigation is-dropdown"
            class:show-lessons={showLessons}
            bind:this={dropdownRootElement}
        >
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
                    aria-controls="side-navigation-panel"
                    onclick={toggleDropdown}
                >
                    <span class="topic-label">Themenübersicht</span>
                    <img
                        src={arrowIcon}
                        alt=""
                        class="topic-dropdown-icon"
                        aria-hidden="true"
                    />
                </button>

                {#if dropdownOpen}
                    <div
                        id="side-navigation-panel"
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
            id="side-navigation-panel"
            class="side-navigation"
            class:is-expanded={expanded}
            class:show-lessons={showLessons}
        >
            {@render navigationContent()}
        </aside>
    {/if}
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
        font-weight: 300;
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

    /* .topic-dropdown.is-open .topic-dropdown-trigger:hover {
        filter: brightness(1.2);
    } */

    .topic-dropdown.is-open .lessons-toggle-label,
    .topic-dropdown.is-open .year-meta {
        color: var(--color-white);
    }

    .topic-dropdown.is-open .toggle-switch {
        border-color: var(--color-white);
        background: transparent;
    }

    .topic-dropdown.is-open .toggle-switch.is-on {
        background: var(--color-white);
    }

    .topic-dropdown.is-open .toggle-thumb {
        background: var(--color-white);
    }

    .topic-dropdown.is-open .toggle-switch.is-on .toggle-thumb {
        background: var(--color-darkblue);
    }

    .topic-dropdown.is-open .year-title {
        color: var(--color-white);
        border-color: var(--color-white);
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

    /* .topic-dropdown.is-open .topic-button.is-active:hover {
        filter: brightness(1.2);
    } */

    .topic-dropdown.is-open .pdf-link {
        color: var(--color-white);
        border-color: var(--color-white);
        background: transparent;
    }

    .topic-dropdown.is-open .pdf-link:hover {
        background: var(--color-white);
        color: var(--color-darkblue);
    }

    .topic-dropdown.is-open .pdf-icon {
        filter: invert(1);
    }

    .topic-dropdown.is-open .pdf-link:hover .pdf-icon {
        filter: none;
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

    .side-navigation.is-dropdown .lessons-toggle {
        position: static;
        margin-left: 0;
        width: fit-content;
    }

    .lessons-toggle {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: calc(15 * var(--u));
        width: fit-content;
        max-width: 100%;
        position: absolute;
        top: calc(-70 * var(--u));
        margin-left: calc(30 * var(--u));
        z-index: 10000;
    }

    .lessons-toggle-label {
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-family: var(--font-mono);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
        color: var(--color-black);
        white-space: nowrap;
    }

    .toggle-switch {
        position: relative;
        flex-shrink: 0;
        width: calc(40 * var(--u));
        height: calc(20 * var(--u));
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        padding: 0;
        cursor: pointer;
        transition: background-color 120ms ease;
    }

    .toggle-switch.is-on {
        background: var(--color-black);
    }

    .toggle-thumb {
        position: absolute;
        top: 50%;
        left: 0px;
        width: calc(17 * var(--u));
        height: calc(17 * var(--u));
        border-radius: 50%;
        background: var(--color-black);
        transform: translateY(-50%);
        transition:
            left 120ms ease,
            background-color 120ms ease;
    }

    .toggle-switch.is-on .toggle-thumb {
        left: calc(100% - calc(15 * var(--u)) - calc(2 * var(--u)));
        background: var(--color-white);
    }

    section {
        display: flex;
        flex-direction: column;
        gap: calc(6 * var(--u));
    }

    .year-title {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: nowrap;
        gap: 0;
        padding: calc(3 * var(--u)) calc(15 * var(--u)) calc(4 * var(--u))
            calc(15 * var(--u));
        border-radius: 9999px;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        color: var(--color-black);
        background: transparent;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        font-family: var(--font-sans);
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        white-space: nowrap;
        transition: gap 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .side-navigation.show-lessons .year-title {
        gap: calc(25 * var(--u));
    }

    .lesson-count {
        flex-shrink: 1;
        min-width: 0;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
        margin-bottom: 0.05rem;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transition:
            max-width 350ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .side-navigation.show-lessons .lesson-count {
        flex-shrink: 0;
        min-width: auto;
        max-width: 4rem;
        opacity: 1;
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
        padding: calc(3 * var(--u)) calc(15 * var(--u)) calc(3 * var(--u))
            calc(15 * var(--u));
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
            font-size 350ms cubic-bezier(0.4, 0, 0.2, 1),
            line-height 350ms cubic-bezier(0.4, 0, 0.2, 1),
            padding 350ms cubic-bezier(0.4, 0, 0.2, 1),
            letter-spacing 350ms cubic-bezier(0.4, 0, 0.2, 1),
            font-weight 350ms cubic-bezier(0.4, 0, 0.2, 1),
            gap 350ms cubic-bezier(0.4, 0, 0.2, 1),
            filter 60ms ease;
    }

    .side-navigation.show-lessons .topic-button {
        gap: calc(25 * var(--u));
    }

    .side-navigation.is-expanded .topic-button {
        font-size: var(--h1-size);
        line-height: var(--h1-line-height);
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        padding: calc(10 * var(--u)) calc(30 * var(--u)) calc(10 * var(--u))
            calc(30 * var(--u));
    }

    .topic-label {
        flex: 1 1 auto;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .topic-lessons {
        flex-shrink: 1;
        min-width: 0;
        align-self: flex-end;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        letter-spacing: var(--h6-letter-spacing);
        transform: translateY(calc(-2 * var(--u)));
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transition:
            max-width 350ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 350ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .side-navigation.show-lessons .topic-lessons {
        flex-shrink: 0;
        min-width: auto;
        max-width: 4rem;
        opacity: 1;
    }

    .side-navigation.is-expanded .topic-lessons {
        transform: translateY(calc(-5 * var(--u)));
    }

    .topic-button:hover,
    .topic-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .topic-button.is-active:hover {
        filter: brightness(1.2);
    }

    .year-meta {
        width: fit-content;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(10 * var(--u));
        margin-top: 0;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        padding: 0px 0px 0px calc(30 * var(--u));
        color: var(--color-black);
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        letter-spacing: var(--h6-letter-spacing);
        box-sizing: border-box;
        transition:
            max-height 350ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 350ms cubic-bezier(0.4, 0, 0.2, 1),
            margin-top 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .side-navigation.show-lessons .year-meta {
        max-height: calc(40 * var(--u));
        opacity: 1;
        margin-top: calc(5 * var(--u));
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
            color 120ms ease,
            font-size 350ms cubic-bezier(0.4, 0, 0.2, 1),
            line-height 350ms cubic-bezier(0.4, 0, 0.2, 1),
            padding 350ms cubic-bezier(0.4, 0, 0.2, 1),
            letter-spacing 350ms cubic-bezier(0.4, 0, 0.2, 1),
            font-weight 350ms cubic-bezier(0.4, 0, 0.2, 1);
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
        .toggle-switch,
        .toggle-thumb,
        .topic-button,
        .topic-lessons,
        .year-title,
        .lesson-count,
        .year-meta,
        .pdf-link {
            transition: none;
        }
    }
</style>
