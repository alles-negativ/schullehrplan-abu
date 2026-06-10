<script lang="ts">
    import { browser } from "$app/environment";
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

    if (browser) {
        const stored = localStorage.getItem(LESSONS_STORAGE_KEY);
        showLessons = stored === null ? true : stored === "true";
        lessonsReady = true;
    }

    const toggleLessons = () => {
        showLessons = !showLessons;
        if (browser) {
            localStorage.setItem(LESSONS_STORAGE_KEY, String(showLessons));
        }
    };
</script>

{#if lessonsReady}
    <aside
        class="side-navigation"
        class:is-expanded={expanded}
        class:show-lessons={showLessons}
    >
        <div class="lessons-toggle">
            <span class="lessons-toggle-label">
                <!-- {showLessons ? "Lektionen ausblenden" : "Lektionen einblenden"} -->
                Lektionen einblenden
            </span>
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
                <section>
                    <h5 class="year-title">
                        <span>{getYearLabel(year)}. Lehrjahr</span>
                        <span class="lesson-count">{getYearLessons(year)}</span>
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
                                        href={getTopicHref(
                                            yearIndex,
                                            topicIndex,
                                        )}
                                        data-sveltekit-noscroll
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
    </aside>
{/if}

<style>
    .side-navigation {
        display: flex;
        flex-direction: column;
        gap: 50px;
        min-width: 0;
        position: relative;
    }

    .lessons-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        width: fit-content;
        max-width: 100%;
        position: absolute;
        top: -70px;
        margin-left: 30px;
    }

    .lessons-toggle-label {
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-family: var(--font-mono);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
        color: #2d2d31;
        white-space: nowrap;
    }

    .toggle-switch {
        position: relative;
        flex-shrink: 0;
        width: 40px;
        height: 20px;
        border: 1.5px solid var(--color-black);
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
        width: 17px;
        height: 17px;
        border-radius: 50%;
        background: var(--color-black);
        transform: translateY(-50%);
        transition:
            left 120ms ease,
            background-color 120ms ease;
    }

    .toggle-switch.is-on .toggle-thumb {
        left: calc(100% - 15px - 2px);
        background: var(--color-white);
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .year-title {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: nowrap;
        gap: 0;
        padding: 3px 15px 4px 15px;
        border-radius: 9999px;
        border: 1.5px solid var(--color-black);
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
        gap: 25px;
    }

    .side-navigation.is-expanded .year-title {
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
        gap: 6px;
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
        padding: 3px 15px 3px 15px;
        border-radius: 9999px;
        cursor: pointer;
        text-decoration: none;
        font-family: var(--font-sans);
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
        color: var(--color-black);
        border: 1.5px solid var(--color-black);
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
        gap: 25px;
    }

    .side-navigation.is-expanded .topic-button {
        font-size: var(--h1-size);
        line-height: var(--h1-line-height);
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        padding: 10px 30px 10px 30px;
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
        transform: translateY(-2px);
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
        transform: translateY(-5px);
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
        gap: 10px;
        margin-top: 0;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        padding: 0px 0px 0px 30px;
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
        max-height: 40px;
        opacity: 1;
        margin-top: 5px;
    }

    .pdf-link {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        margin-top: 10px;
        padding: 3px 15px 3px 12px;
        border-radius: 9999px;
        border: 1.5px solid var(--color-black);
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

    .side-navigation.is-expanded .pdf-link {
        font-size: var(--h1-size);
        line-height: var(--h1-line-height);
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        padding: 10px 30px 10px 24px;
        gap: 16px;
    }

    .pdf-icon {
        flex-shrink: 0;
    }

    .side-navigation.is-expanded .pdf-icon {
        width: 32px;
        height: 32px;
    }

    .pdf-link:hover {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .pdf-link:hover .pdf-icon {
        filter: invert(1);
    }

    @media (prefers-reduced-motion: reduce) {
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
