<script lang="ts">
    import { browser } from "$app/environment";
    import {
        getModeYears,
        getTopicTitle,
        getYearLabel,
        type EducationMode,
        type Topic,
        type YearEntry,
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

    const getYearLessons = (year: YearEntry) => {
        const topicLessons = (year.themenbereiche ?? []).reduce(
            (sum: number, topic: Topic) => sum + (topic.lessons ?? 0),
            0,
        );
        return topicLessons + (year.additional_lessons ?? 0);
    };
</script>

{#if lessonsReady}
    <aside class="side-navigation" class:is-expanded={expanded}>
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
                        {#if showLessons}
                            <span class="lesson-count"
                                >{getYearLessons(year)}</span
                            >
                        {/if}
                    </h5>
                    {#if (year.themenbereiche?.length ?? 0) === 0}
                        <p>Keine Themenbereiche definiert.</p>
                    {:else}
                        <ul class="topic-list">
                            {#each year.themenbereiche ?? [] as topic, topicIndex}
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
                                        {#if showLessons && topic.lessons != null}
                                            <span class="topic-lessons"
                                                >{topic.lessons}</span
                                            >
                                        {/if}
                                    </a>
                                </li>
                            {/each}
                            {#if showLessons && year.additional_lessons != null}
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
        gap: 25px;
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
    }

    .side-navigation.is-expanded .year-title {
    }

    .lesson-count {
        flex-shrink: 0;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
        margin-bottom: 0.05rem;
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
        gap: 25px;
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
            border-color 120ms ease;
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
        flex-shrink: 0;
        align-self: flex-end;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        letter-spacing: var(--h6-letter-spacing);
        transform: translateY(-2px);
    }

    .side-navigation.is-expanded .topic-lessons {
        transform: translateY(-5px);
    }

    .topic-button:hover,
    .topic-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .year-meta {
        width: fit-content;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 5px;
        padding: 0px 0px 0px 30px;
        color: var(--color-black);
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        letter-spacing: var(--h6-letter-spacing);
        box-sizing: border-box;
    }

    @media (prefers-reduced-motion: reduce) {
        .toggle-switch,
        .toggle-thumb,
        .topic-button {
            transition: none;
        }
    }
</style>
