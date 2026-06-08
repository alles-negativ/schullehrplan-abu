<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import CircularityOverview from "$lib/components/CircularityOverview.svelte";
    import SideNavigation from "$lib/components/SideNavigation.svelte";
    import Topic from "$lib/components/Topic.svelte";
    import {
        getModeYears,
        getYearLabel,
        type Topic as TopicType,
    } from "$lib/data/education-modes";
    import { marked } from "marked";

    let { data } = $props();
    const years = $derived(getModeYears(data.mode));
    const isOverview = $derived(
        !page.url.searchParams.get("view") &&
            !page.url.searchParams.get("year") &&
            !page.url.searchParams.get("topic"),
    );
    const currentView = $derived(
        page.url.searchParams.get("view") === "zirkularitaet"
            ? "zirkularitaet"
            : isOverview
              ? "overview"
              : "lehrplan",
    );
    const hasSelectedTopic = $derived(
        page.url.searchParams.get("year") != null &&
            page.url.searchParams.get("topic") != null,
    );

    type SelectedTopic = {
        key: string;
        topic: TopicType;
        yearLabel: string;
    };

    const selectedTopic = $derived.by(() => {
        if (!hasSelectedTopic) return null;

        const yearParam = Number(
            browser ? page.url.searchParams.get("year") : null,
        );
        const topicParam = Number(
            browser ? page.url.searchParams.get("topic") : null,
        );

        if (Number.isInteger(yearParam) && Number.isInteger(topicParam)) {
            const year = years[yearParam];
            const topic = year?.themenbereiche?.[topicParam];
            if (year && topic) {
                return {
                    key: `${yearParam}-${topicParam}`,
                    topic,
                    yearLabel: getYearLabel(year),
                } satisfies SelectedTopic;
            }
        }

        return null;
    });

    const getTopicHref = (yearIndex: number, topicIndex: number) =>
        `${page.url.pathname}?year=${yearIndex}&topic=${topicIndex}`;
</script>

{#if currentView === "overview"}
    <section class="mode-overview mode-grid">
        {#if data.mode.overview}
            <div class="overview-content">
                {@html marked.parse(data.mode.overview) as string}
            </div>
        {/if}
    </section>
{:else if currentView === "lehrplan"}
    <div class="mode-route mode-grid" class:is-expanded={!hasSelectedTopic}>
        <SideNavigation
            mode={data.mode}
            selectedTopicKey={selectedTopic?.key}
            expanded={!hasSelectedTopic}
            {getTopicHref}
        />

        {#if selectedTopic}
            <section class="topics-content">
                <Topic
                    topic={selectedTopic.topic}
                    yearLabel={selectedTopic.yearLabel}
                />
            </section>
        {/if}
    </div>
{:else}
    <section class="circularity-content">
        <CircularityOverview mode={data.mode} />
    </section>
{/if}

<style>
    .mode-grid {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
        column-gap: var(--grid-gutter);
    }

    .mode-route {
        align-items: start;
    }

    .mode-route.is-expanded > :global(.side-navigation) {
        grid-column: 1 / span 16;
    }

    .mode-route:not(.is-expanded) > :global(.side-navigation) {
        grid-column: 1 / span 6;
    }

    .overview-content,
    .topics-content {
        grid-column: 7 / span 10;
        min-width: 0;
    }

    .circularity-content {
        margin-top: 1rem;
    }

    .mode-overview {
        margin: 0 33px;
    }

    .overview-content :global(p) {
        margin: 0 0 2rem;
    }

    .overview-content :global(p:last-child) {
        margin-bottom: 0;
    }
</style>
