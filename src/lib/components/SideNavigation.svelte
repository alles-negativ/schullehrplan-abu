<script lang="ts">
    import {
        getModeYears,
        getTopicTitle,
        getYearLabel,
        type EducationMode,
        type Topic,
        type YearEntry,
    } from "$lib/data/education-modes";

    let {
        mode,
        selectedTopicKey,
        getTopicHref,
    }: {
        mode: EducationMode;
        selectedTopicKey?: string;
        getTopicHref: (yearIndex: number, topicIndex: number) => string;
    } = $props();

    const getYearLessons = (year: YearEntry) => {
        const topicLessons = (year.themenbereiche ?? []).reduce(
            (sum: number, topic: Topic) => sum + (topic.lessons ?? 0),
            0,
        );
        return topicLessons + (year.additional_lessons ?? 0);
    };
</script>

<aside class="side-navigation">
    {#if getModeYears(mode).length === 0}
        <p>Keine Lehrjahre definiert.</p>
    {:else}
        {#each getModeYears(mode) as year, yearIndex}
            <section>
                <h2 class="year-title">
                    <span>{getYearLabel(year)}. Lehrjahr</span>
                    <span class="lesson-count"
                        >{getYearLessons(year)} Lektionen</span
                    >
                </h2>
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
                                    href={getTopicHref(yearIndex, topicIndex)}
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
                                    {#if topic.lessons != null}
                                        <span class="topic-lessons"
                                            >{topic.lessons}</span
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
</aside>

<style>
    .side-navigation {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .year-title {
        margin: 0;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 0.75rem;
        /* width: 100%; */
        font-size: 0.95rem;
        font-weight: 500;
        line-height: 1.2;
        padding: 0.35rem 1rem;
        border-radius: 9999px;
        border: 1px solid #3f3f46;
    }

    .lesson-count {
        flex-shrink: 0;
        font-size: 0.72rem;
        font-weight: 400;
        line-height: 1;
        margin-bottom: 0.05rem;
    }

    .topic-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .topic-button {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        text-align: left;
        padding: 0.3rem 0.9rem;
        border: 1px solid #3f3f46;
        border-radius: 9999px;
        background: #ffffff;
        cursor: pointer;
        text-decoration: none;
        color: #2d2d31;
        font-size: 0.82rem;
        line-height: 1.15;
        transition:
            background-color 120ms ease,
            color 120ms ease,
            border-color 120ms ease;
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
        font-size: 0.8rem;
    }

    .topic-button:hover {
        background: #f4f4f5;
    }

    .topic-button.is-active {
        background: #2f2f33;
        border-color: #2f2f33;
        color: #ffffff;
    }

    .year-meta {
        width: fit-content;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        margin-top: 0.2rem;
        padding: 0.3rem 0.9rem 0.3rem 2.05rem;
        border: 1px solid #c4c4c9;
        border-radius: 9999px;
        color: #a1a1aa;
        font-size: 0.8rem;
    }

    @media (max-width: 900px) {
        .year-title {
            font-size: 0.9rem;
        }

        .lesson-count {
            font-size: 0.68rem;
        }

        .topic-button {
            font-size: 0.78rem;
        }

        .topic-lessons,
        .year-meta {
            font-size: 0.75rem;
        }
    }
</style>
