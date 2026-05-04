<script lang="ts">
    import {
        getModeYears,
        getTopicTitle,
        getYearLabel,
        type EducationMode,
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
</script>

<aside class="side-navigation">
    {#if getModeYears(mode).length === 0}
        <p>Keine Lehrjahre definiert.</p>
    {:else}
        {#each getModeYears(mode) as year, yearIndex}
            <section>
                <h2>{getYearLabel(year)}. Lehrjahr</h2>
                {#if (year.themenbereiche?.length ?? 0) === 0}
                    <p>Keine Themenbereiche definiert.</p>
                {:else}
                    <ul>
                        {#each year.themenbereiche ?? [] as topic, topicIndex}
                            <li>
                                <a
                                    class="topic-button"
                                    class:is-active={selectedTopicKey ===
                                        `${yearIndex}-${topicIndex}`}
                                    href={getTopicHref(yearIndex, topicIndex)}
                                    aria-current={selectedTopicKey === `${yearIndex}-${topicIndex}`
                                        ? "true"
                                        : undefined}
                                >
                                    {#if topic.number != null}
                                        <span>{topic.number}. </span>
                                    {/if}
                                    <span>{getTopicTitle(topic)}</span>
                                </a>
                            </li>
                        {/each}
                        {#if year.additional_lessons != null}
                            <li class="year-meta">
                                Weitere Lektionen: {year.additional_lessons}
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
        gap: 10px;
    }

    .topic-button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.45rem 0.6rem;
        border: 1px solid transparent;
        border-radius: 0.4rem;
        background: transparent;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
    }

    .topic-button:hover {
        background: #f1f5f9;
    }

    .topic-button.is-active {
        background: #dbeafe;
        border-color: #60a5fa;
    }

    .year-meta {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: #4b5563;
    }
</style>
