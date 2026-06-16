<script lang="ts">
    import { marked } from "marked";
    import { slide } from "svelte/transition";
    import arrowIcon from "$lib/assets/arrow.svg";
    import { type QvSection } from "$lib/data/qv";

    let {
        sections,
        chapterNumber,
    }: {
        sections: QvSection[];
        chapterNumber?: number;
    } = $props();

    const sectionLabel = (section: QvSection) =>
        section.number == null
            ? undefined
            : chapterNumber != null
              ? `${chapterNumber}.${section.number}`
              : section.number;

    const subsectionLabel = (section: QvSection, sub: { number?: string }) =>
        sub.number == null
            ? undefined
            : chapterNumber != null && section.number != null
              ? `${chapterNumber}.${section.number}.${sub.number}`
              : sub.number;

    let collapsedByIndex = $state<Record<number, boolean>>({});

    const isCollapsed = (index: number) => collapsedByIndex[index] ?? true;

    const isExpanded = (index: number) => !isCollapsed(index);

    const toggleSection = (index: number) => {
        collapsedByIndex = {
            ...collapsedByIndex,
            [index]: !isCollapsed(index),
        };
    };

    $effect(() => {
        sections;
        collapsedByIndex = {};
    });
</script>

{#if sections.length > 0}
    <section class="qv-sections">
        {#each sections as section, index}
            <article class="section-item" class:is-expanded={isExpanded(index)}>
                <button
                    type="button"
                    class="section-header"
                    class:is-expanded={isExpanded(index)}
                    aria-expanded={isExpanded(index)}
                    onclick={() => toggleSection(index)}
                >
                    <div class="section-meta">
                        <div class="section-title">
                            {#if sectionLabel(section)}
                                <span class="section-heading"
                                    >{sectionLabel(section)}</span
                                >
                            {/if}
                            <span class="section-summary">{section.title}</span>
                        </div>
                    </div>
                    <span
                        class="section-toggle-icon-wrap"
                        class:is-expanded={isExpanded(index)}
                    >
                        <img
                            src={arrowIcon}
                            alt=""
                            class="section-toggle-icon"
                        />
                    </span>
                </button>

                {#if isExpanded(index)}
                    <div
                        class="section-body"
                        transition:slide={{
                            duration: 220,
                            easing: (t) => t * (2 - t),
                        }}
                    >
                        {#if section.body}
                            <div class="section-text">
                                {@html marked.parse(section.body) as string}
                            </div>
                        {/if}

                        {#if section.table}
                            {@const table = section.table}
                            <div class="section-table-block">
                                {#if table.caption}
                                    <p class="table-caption">{table.caption}</p>
                                {/if}
                                <table class="section-table">
                                    <thead>
                                        <tr>
                                            <th scope="col"
                                                >{table.column_label ??
                                                    "Teil"}</th
                                            >
                                            <th scope="col"
                                                >{table.column_description ??
                                                    "Inhalt / Beschreibung"}</th
                                            >
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each table.rows as row}
                                            <tr>
                                                <th scope="row">{row.label}</th>
                                                <td>{row.description}</td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}

                        {#if section.flex_table}
                            {@const ft = section.flex_table}
                            <div class="section-table-block">
                                {#if ft.caption}
                                    <p class="table-caption">{ft.caption}</p>
                                {/if}
                                <table class="section-table flex-table">
                                    <thead>
                                        <tr>
                                            {#each ft.columns as col}
                                                <th scope="col">{col}</th>
                                            {/each}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each ft.rows as row}
                                            <tr>
                                                {#each row as cell, i}
                                                    {#if i === 0}
                                                        <th scope="row"
                                                            >{cell}</th
                                                        >
                                                    {:else}
                                                        <td>{cell}</td>
                                                    {/if}
                                                {/each}
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}

                        {#each section.subsections ?? [] as subsection}
                            <div class="subsection">
                                <h4 class="subsection-title">
                                    {#if subsectionLabel(section, subsection)}
                                        <span class="subsection-heading"
                                            >{subsectionLabel(
                                                section,
                                                subsection,
                                            )}</span
                                        >
                                    {/if}
                                    <span class="subsection-summary"
                                        >{subsection.title}</span
                                    >
                                </h4>
                                {#if subsection.body}
                                    <div class="subsection-text">
                                        {@html marked.parse(
                                            subsection.body,
                                        ) as string}
                                    </div>
                                {/if}
                                {#if subsection.table}
                                    {@const table = subsection.table}
                                    <div class="section-table-block">
                                        {#if table.caption}
                                            <p class="table-caption">
                                                {table.caption}
                                            </p>
                                        {/if}
                                        <table class="section-table">
                                            <thead>
                                                <tr>
                                                    <th scope="col"
                                                        >{table.column_label ??
                                                            "Teil"}</th
                                                    >
                                                    <th scope="col"
                                                        >{table.column_description ??
                                                            "Inhalt / Beschreibung"}</th
                                                    >
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each table.rows as row}
                                                    <tr>
                                                        <th scope="row"
                                                            >{row.label}</th
                                                        >
                                                        <td
                                                            >{row.description}</td
                                                        >
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}
                                {#if subsection.flex_table}
                                    {@const ft = subsection.flex_table}
                                    <div class="section-table-block">
                                        {#if ft.caption}
                                            <p class="table-caption">
                                                {ft.caption}
                                            </p>
                                        {/if}
                                        <table class="section-table flex-table">
                                            <thead>
                                                <tr>
                                                    {#each ft.columns as col}
                                                        <th scope="col"
                                                            >{col}</th
                                                        >
                                                    {/each}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each ft.rows as row}
                                                    <tr>
                                                        {#each row as cell, i}
                                                            {#if i === 0}
                                                                <th scope="row"
                                                                    >{cell}</th
                                                                >
                                                            {:else}
                                                                <td>{cell}</td>
                                                            {/if}
                                                        {/each}
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </article>
        {/each}
    </section>
{/if}

<style>
    .qv-sections {
        margin-top: 80px;
    }

    .section-item {
        position: relative;
        margin-top: 0.65rem;
        border: 1.5px solid var(--color-black);
        border-radius: 30px;
        padding: 23px 21px 30px 33px;
        background: var(--color-white);
    }

    .section-item:not(.is-expanded) {
        padding-bottom: 23px;
    }

    .section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
    }

    .section-meta {
        min-width: 0;
        flex: 1 1 auto;
    }

    .section-heading {
        display: block;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        /* letter-spacing: var(--h4-letter-spacing); */
        color: var(--color-black);
    }

    .section-summary {
        display: block;
        margin-top: 5px;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        color: var(--color-black);
    }

    .section-toggle-icon-wrap {
        flex-shrink: 0;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        width: 52px;
        height: 52px;
        display: inline-grid;
        place-items: center;
        background: var(--color-darkblue);
        transition:
            background-color 120ms ease,
            filter 60ms ease;
    }

    .section-header:hover .section-toggle-icon-wrap {
        filter: brightness(1.2);
    }

    .section-toggle-icon {
        height: 30px;
        display: block;
        transform: rotate(180deg);
        transition: transform 120ms ease;
    }

    .section-toggle-icon-wrap.is-expanded .section-toggle-icon {
        transform: rotate(0deg);
    }

    .section-body {
        margin-top: 1.5rem;
    }

    .section-text :global(p),
    .subsection-text :global(p),
    .section-text :global(ul),
    .subsection-text :global(ul),
    .section-text :global(ol),
    .subsection-text :global(ol) {
        margin: 0 0 1rem;
        font-size: var(--p-size);
        line-height: var(--p-line-height);
        font-weight: var(--p-weight);
        letter-spacing: var(--p-letter-spacing);
    }

    .section-text :global(ul),
    .subsection-text :global(ul) {
        /* margin: 0 0 1rem; */
        padding-left: 25px;
    }

    .section-text :global(p:last-child),
    .subsection-text :global(p:last-child),
    .section-text :global(ul:last-child),
    .subsection-text :global(ul:last-child),
    .section-text :global(ol:last-child),
    .subsection-text :global(ol:last-child) {
        margin-bottom: 0;
    }

    .section-table-block {
        margin-top: 1.5rem;
        overflow-x: auto;
    }

    .table-caption {
        margin: 0 0 0.75rem;
    }

    .section-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--body-size);
        line-height: var(--body-line-height);
    }

    .section-table th,
    .section-table td {
        border: 1.5px solid var(--color-black);
        padding: 0.6rem 0.85rem;
        text-align: left;
        vertical-align: top;
    }

    .flex-table th:not([scope="row"]),
    .flex-table td {
        text-align: center;
        white-space: nowrap;
        padding: 0.6rem 0.5rem;
    }

    .section-table thead th {
        background: var(--color-darkblue);
        color: var(--color-white);
        font-weight: var(--h4-weight);
    }

    .section-table tbody th[scope="row"] {
        font-weight: var(--h5-weight);
        background: var(--color-background);
    }

    .subsection {
        margin-top: 40px;
        padding-top: 30px;
        border-top: 8px solid var(--color-background);
    }

    .subsection-heading {
        display: block;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        color: var(--color-black);
    }

    .subsection-summary {
        display: block;
        margin-top: 0px;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
        color: var(--color-black);
    }

    .subsection-title {
        margin: 0 0 0.75rem;
    }
</style>
