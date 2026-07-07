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
    import { scrollToPageTop } from "$lib/scroll-to-top";
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

    let displayedTopic = $state<SelectedTopic | null>(null);
    let hydrated = false;
    let topicScrollToken = 0;

    $effect(() => {
        const next = selectedTopic;

        // First run after page load: show the topic from the URL directly.
        if (!hydrated) {
            hydrated = true;
            displayedTopic = next;
            return;
        }

        if (!next) {
            displayedTopic = null;
            return;
        }

        if (displayedTopic?.key === next.key) return;

        // Scroll up while the old content (and its open accordions) is
        // still visible, then swap to the new topic at the top.
        const token = ++topicScrollToken;
        void scrollToPageTop().then(() => {
            if (token !== topicScrollToken) return;
            displayedTopic = next;
        });
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

        {#if displayedTopic}
            <section class="topics-content">
                {#key displayedTopic.key}
                    <Topic
                        topic={displayedTopic.topic}
                        yearLabel={displayedTopic.yearLabel}
                    />
                {/key}
            </section>
        {/if}
    </div>
{:else}
    <section class="circularity-content">
        <CircularityOverview mode={data.mode} />
    </section>
{/if}

<style>
    :global(.page-foreground:has(.mode-route)) {
        overflow: visible;
    }

    .mode-grid {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
        column-gap: var(--grid-gutter);
    }

    .mode-route {
        align-items: start;
        grid-template-columns: minmax(0, 16fr);
        transition: grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: calc(180 * var(--u));
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
        margin: 0 calc(33 * var(--u));
        margin-top: calc(180 * var(--u));
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
        .mode-overview {
            width: 100%;
            margin-left: 0;
            margin-right: 0;
            grid-template-columns: minmax(0, 1fr);
        }

        .overview-content {
            grid-column: 1;
        }

        .mode-route.is-expanded {
            grid-template-columns: minmax(0, 1fr);
        }

        .mode-route:not(.is-expanded) {
            grid-template-columns: minmax(0, 1fr);
            row-gap: calc(80 * var(--u));
            margin-top: calc(8.5 * var(--u));
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
