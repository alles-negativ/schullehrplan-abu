<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { marked } from "marked";
    import QvAccordion from "$lib/components/QvAccordion.svelte";
    import QvSideNavigation from "$lib/components/QvSideNavigation.svelte";
    import { getQvChapterLabel } from "$lib/data/qv";

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

<div
    class="qv-route mode-grid"
    class:is-expanded={selectedChapterIndex === -1}
>
    <QvSideNavigation
        chapters={data.qv.chapters}
        {selectedChapterIndex}
        expanded={selectedChapterIndex === -1}
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
                            {@html marked.parse(
                                selectedChapter.intro,
                            ) as string}
                        </div>
                    {/if}

                    {#each selectedChapter.tables ?? [] as table}
                        <div class="chapter-table-wrap">
                            {#if table.caption}
                                <p class="chapter-table-caption">
                                    {table.caption}
                                </p>
                            {/if}
                            <table class="chapter-table">
                                <thead>
                                    <tr>
                                        {#each table.columns as col}
                                            <th scope="col">{col}</th>
                                        {/each}
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each table.rows as row}
                                        <tr>
                                            {#each row as cell, i}
                                                {#if i === 0}
                                                    <th scope="row">{cell}</th>
                                                {:else}
                                                    <td>{cell}</td>
                                                {/if}
                                            {/each}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/each}

                    {#if selectedChapter.additional_content}
                        <div class="additional-content">
                            {@html marked.parse(
                                selectedChapter.additional_content,
                            ) as string}
                        </div>
                    {/if}
                </div>

                {#if selectedChapter.sections.length > 0}
                    <QvAccordion sections={selectedChapter.sections} chapterNumber={selectedChapter.number} />
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
        margin-top: 35px;
    }

    .description :global(p) {
        margin: 0 0 30px;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
    }

    .description :global(p:last-child) {
        margin-bottom: 0;
    }

    .description :global(ul),
    .description :global(ol) {
        margin: 0 0 30px;
        padding-left: 30px;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
    }

    .description :global(ul:last-child),
    .description :global(ol:last-child) {
        margin-bottom: 0;
    }

    .description :global(li + li) {
        margin-top: 0.35rem;
    }

    .description :global(strong) {
        font-weight: 600;
    }

    .chapter-table-wrap {
        margin-top: 40px;
        overflow-x: auto;
    }

    .chapter-table-caption {
        margin: 0 0 0.75rem;
        font-size: var(--p-size);
        line-height: var(--p-line-height);
        font-weight: var(--p-weight);
        letter-spacing: var(--p-letter-spacing);
    }

    .chapter-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--body-size);
        line-height: var(--body-line-height);
    }

    .chapter-table th,
    .chapter-table td {
        border: 1.5px solid var(--color-black);
        padding: 0.6rem 0.85rem;
        text-align: left;
        vertical-align: top;
    }

    .chapter-table thead th {
        background: var(--color-darkblue);
        color: var(--color-white);
        font-weight: var(--h4-weight);
    }

    .chapter-table tbody th[scope="row"] {
        font-weight: var(--h5-weight);
        background: var(--color-background);
    }

    .additional-content {
        margin-top: 40px;
    }

    .additional-content :global(p) {
        margin: 0 0 25px;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
    }

    .additional-content :global(p:last-child) {
        margin-bottom: 0;
    }

    .additional-content :global(strong) {
        font-weight: 600;
    }

    @media (max-width: 1100px) {
        .qv-route.is-expanded {
            grid-template-columns: minmax(0, 1fr);
        }

        .qv-route:not(.is-expanded) {
            grid-template-columns: minmax(0, 1fr);
            row-gap: 80px;
            margin-top: 8.5px;
        }

        .qv-route > :global(.side-navigation.is-dropdown) {
            grid-column: 1;
        }

        .topics-content {
            grid-column: 1;
        }
    }
</style>
