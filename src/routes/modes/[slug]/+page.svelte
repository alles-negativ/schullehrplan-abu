<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import SideNavigation from "$lib/components/SideNavigation.svelte";
    import Topic from "$lib/components/Topic.svelte";
    import {
        getModeYears,
        getYearLabel,
        type Topic as TopicType,
    } from "$lib/data/education-modes";

    let { data } = $props();
    const years = $derived(getModeYears(data.mode));
    const currentView = $derived(
        page.url.searchParams.get("view") === "zirkularitaet"
            ? "zirkularitaet"
            : "lehrplan",
    );

    type SelectedTopic = {
        key: string;
        topic: TopicType;
        yearLabel: string;
    };

    const firstTopic = $derived.by(() => {
        for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
            const year = years[yearIndex];
            const topics = year.themenbereiche ?? [];
            if (topics.length > 0) {
                return {
                    key: `${yearIndex}-0`,
                    topic: topics[0],
                    yearLabel: getYearLabel(year),
                } satisfies SelectedTopic;
            }
        }
        return null;
    });

    const selectedTopic = $derived.by(() => {
        const yearParam = Number(page.url.searchParams.get("year"));
        const topicParam = Number(page.url.searchParams.get("topic"));

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

        return firstTopic;
    });

    const normalizedSearch = $derived.by(() => {
        if (!selectedTopic) return null;
        const [yearIndex, topicIndex] = selectedTopic.key.split("-");
        const params = new URLSearchParams();
        params.set("year", yearIndex);
        params.set("topic", topicIndex);
        if (currentView === "zirkularitaet") {
            params.set("view", "zirkularitaet");
        }
        return `?${params.toString()}`;
    });

    $effect(() => {
        if (!normalizedSearch) return;
        if (page.url.search === normalizedSearch) return;

        goto(`${page.url.pathname}${normalizedSearch}`, {
            replaceState: true,
            keepFocus: true,
            noScroll: true,
        });
    });

    const getTopicHref = (yearIndex: number, topicIndex: number) =>
        `${page.url.pathname}?year=${yearIndex}&topic=${topicIndex}${currentView === "zirkularitaet" ? "&view=zirkularitaet" : ""}`;
</script>

<div class="spacer"></div>

{#if currentView === "lehrplan"}
    <div class="mode-route">
        <SideNavigation
            mode={data.mode}
            selectedTopicKey={selectedTopic?.key}
            {getTopicHref}
        />

        <section class="topics-content">
            {#if !selectedTopic}
                <p>Bitte wähle ein Thema in der Seitennavigation.</p>
            {:else}
                <Topic
                    topic={selectedTopic.topic}
                    yearLabel={selectedTopic.yearLabel}
                />
            {/if}
        </section>
    </div>
{:else}
    <section class="circularity-content">
        <h2>Zirkularität</h2>
        <p>Die Zirkularitätsansicht wird hier angezeigt.</p>
    </section>
{/if}

<style>
    .mode-route {
        display: grid;
        grid-template-columns: minmax(16rem, 30%) 1fr;
        gap: 1rem;
        align-items: start;
    }

    .topics-content {
        min-width: 0;
    }

    .circularity-content {
        margin-top: 1rem;
    }

    .spacer {
        height: 50px;
    }
</style>
