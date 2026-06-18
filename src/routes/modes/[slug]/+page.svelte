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
    const getSearchParam = (key: string) =>
        browser ? page.url.searchParams.get(key) : null;
    const isOverview = $derived(
        !getSearchParam("view") &&
            !getSearchParam("year") &&
            !getSearchParam("topic"),
    );
    const currentView = $derived(
        getSearchParam("view") === "zirkularitaet"
            ? "zirkularitaet"
            : isOverview
              ? "overview"
              : "lehrplan",
    );
    const hasSelectedTopic = $derived(
        getSearchParam("year") != null && getSearchParam("topic") != null,
    );

    type SelectedTopic = {
        key: string;
        topic: TopicType;
        yearLabel: string;
    };

    const selectedTopic = $derived.by(() => {
        if (!hasSelectedTopic) return null;

        const yearParam = Number(getSearchParam("year"));
        const topicParam = Number(getSearchParam("topic"));

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

<svelte:head>
    <title>Schullehrplan ABU - {data.mode.title}</title>
</svelte:head>

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
        grid-template-columns: minmax(0, 16fr);
        transition: grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: 180px;
    }

    .mode-route:not(.is-expanded) {
        grid-template-columns: minmax(0, 5fr) minmax(0, 10fr);
    }

    .mode-route > :global(.side-navigation) {
        grid-column: 1;
        min-width: 0;
    }

    .overview-content {
        grid-column: 7 / span 10;
        min-width: 0;
    }

    .topics-content {
        grid-column: 2;
        min-width: 0;
    }

    .mode-overview {
        margin: 0 33px;
        margin-top: 180px;
    }

    .overview-content :global(p) {
        margin: 0 0 2rem;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
    }

    .overview-content :global(p:last-child) {
        margin-bottom: 0;
    }

    @media (max-width: 1100px) {
        .mode-route.is-expanded {
            grid-template-columns: minmax(0, 1fr);
        }

        .mode-route:not(.is-expanded) {
            grid-template-columns: minmax(0, 1fr);
            row-gap: 80px;
            margin-top: 10px;
        }

        .mode-route > :global(.side-navigation.is-dropdown) {
            grid-column: 1;
        }

        .topics-content {
            grid-column: 1;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .mode-route {
            transition: none;
        }
    }
</style>
