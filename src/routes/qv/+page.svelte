<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import QvAccordion from "$lib/components/QvAccordion.svelte";
    import QvSideNavigation from "$lib/components/QvSideNavigation.svelte";
    import { getQvChapterLabel } from "$lib/data/qv";
    import { marked } from "marked";

    let { data } = $props();

    const getSearchParam = (key: string) =>
        browser ? page.url.searchParams.get(key) : null;

    const selectedChapterIndex = $derived.by(() => {
        const chapterParam = getSearchParam("chapter");
        if (chapterParam === null) return -1;

        const index = Number(chapterParam);
        if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < data.qv.chapters.length
        ) {
            return index;
        }

        return -1;
    });

    const selectedChapter = $derived(
        selectedChapterIndex >= 0
            ? (data.qv.chapters[selectedChapterIndex] ?? null)
            : null,
    );

    const getChapterHref = (chapterIndex: number) =>
        `${page.url.pathname}?chapter=${chapterIndex}`;
</script>

<svelte:head>
    <title>Schullehrplan ABU - Qualifikationsverfahren</title>
</svelte:head>

<div class="qv-route mode-grid">
    <QvSideNavigation
        chapters={data.qv.chapters}
        {selectedChapterIndex}
        {getChapterHref}
    />

    {#if selectedChapter}
        <section class="topics-content">
            <article class="qv-chapter">
                <div class="content-wrap">
                    <h1 class="topic-title">
                        {getQvChapterLabel(selectedChapter)}
                    </h1>

                    {#if selectedChapter.intro}
                        <div class="description">
                            {@html marked.parse(selectedChapter.intro) as string}
                        </div>
                    {/if}
                </div>

                {#if selectedChapter.sections.length > 0}
                    <QvAccordion sections={selectedChapter.sections} />
                {:else}
                    <p class="empty-hint">Inhalt folgt.</p>
                {/if}
            </article>
        </section>
    {/if}
</div>

<style>
    .mode-grid {
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 1fr) minmax(0, 10fr);
        column-gap: var(--grid-gutter);
        margin-top: 180px;
        align-items: start;
    }

    .qv-route > :global(.side-navigation) {
        grid-column: 1;
        min-width: 0;
    }

    .topics-content {
        grid-column: 3;
        min-width: 0;
        padding-bottom: 4rem;
    }

    .content-wrap {
        margin: 0 33px;
    }

    .description {
        margin-top: 1.2rem;
    }

    .description :global(p) {
        margin: 0 0 40px;
    }

    .empty-hint {
        margin: 80px 33px 0;
        opacity: 0.6;
    }
</style>
