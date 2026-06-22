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

    const flexTableLabel = (text: string) => text.split("\n").slice(0, 2);

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
                                <div class="section-table-scroll">
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
                                {#if table.caption}
                                    <p class="table-caption">{table.caption}</p>
                                {/if}
                            </div>
                        {/if}

                        {#if section.flex_table}
                            {@const ft = section.flex_table}
                            <div class="section-table-block">
                                <div class="section-table-scroll">
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
                                                            <th scope="row">
                                                                <span
                                                                    class="flex-table-label"
                                                                >
                                                                    {#each flexTableLabel(cell) as line}
                                                                        <span
                                                                            class="flex-table-label-line"
                                                                            >{line}</span
                                                                        >
                                                                    {/each}
                                                                </span>
                                                            </th>
                                                        {:else}
                                                            <td>{cell}</td>
                                                        {/if}
                                                    {/each}
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                                {#if ft.caption}
                                    <p class="table-caption">{ft.caption}</p>
                                {/if}
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
                                        <div class="section-table-scroll">
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
                                        {#if table.caption}
                                            <p class="table-caption">
                                                {table.caption}
                                            </p>
                                        {/if}
                                    </div>
                                {/if}
                                {#if subsection.flex_table}
                                    {@const ft = subsection.flex_table}
                                    <div class="section-table-block">
                                        <div class="section-table-scroll">
                                            <table
                                                class="section-table flex-table"
                                            >
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
                                                                    <th
                                                                        scope="row"
                                                                    >
                                                                        <span
                                                                            class="flex-table-label"
                                                                        >
                                                                            {#each flexTableLabel(cell) as line}
                                                                                <span
                                                                                    class="flex-table-label-line"
                                                                                    >{line}</span
                                                                                >
                                                                            {/each}
                                                                        </span>
                                                                    </th>
                                                                {:else}
                                                                    <td>{cell}</td>
                                                                {/if}
                                                            {/each}
                                                        </tr>
                                                    {/each}
                                                </tbody>
                                            </table>
                                        </div>
                                        {#if ft.caption}
                                            <p class="table-caption">
                                                {ft.caption}
                                            </p>
                                        {/if}
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
        margin-top: calc(80 * var(--u));
    }

    .section-item {
        position: relative;
        margin-top: 0.65rem;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: calc(30 * var(--u));
        padding: calc(23 * var(--u)) calc(21 * var(--u)) calc(30 * var(--u))
            calc(33 * var(--u));
        background: var(--color-white);
    }

    .section-item:not(.is-expanded) {
        padding-bottom: calc(23 * var(--u));
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
        margin-top: calc(5 * var(--u));
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        color: var(--color-black);
    }

    .section-toggle-icon-wrap {
        flex-shrink: 0;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        width: calc(52 * var(--u));
        height: calc(52 * var(--u));
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
        height: calc(30 * var(--u));
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
        padding-left: calc(25 * var(--u));
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
    }

    .section-table-scroll {
        overflow-x: auto;
    }

    .table-caption {
        margin: 0.75rem 0 0;
    }

    .section-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
    }

    .section-table th,
    .section-table td {
        border: none;
        border-bottom: 1px solid var(--color-black);
        padding: calc(8 * var(--u)) calc(16 * var(--u));
        text-align: left;
        vertical-align: top;
    }

    .flex-table {
        table-layout: fixed;
        width: 100%;
        min-width: calc(360 * var(--u) + 13 * var(--flex-cell-size));
        --flex-cell-size: calc(2 * var(--h5-line-height) + 16 * var(--u));
    }

    .flex-table thead th:not(:first-child),
    .flex-table tbody td {
        width: var(--flex-cell-size);
        min-width: var(--flex-cell-size);
        max-width: var(--flex-cell-size);
        padding: 0;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        box-sizing: border-box;
    }

    .flex-table tbody tr {
        height: var(--flex-cell-size);
    }

    .flex-table tbody td {
        height: var(--flex-cell-size);
        border-left: 1px solid var(--color-black);
    }

    .flex-table tbody th[scope="row"] {
        vertical-align: middle;
    }

    .flex-table-label {
        display: block;
        line-height: var(--h5-line-height);
        overflow: hidden;
    }

    .flex-table-label-line {
        display: block;
        white-space: nowrap;
        overflow: hidden;
    }

    .flex-table thead th:first-child,
    .flex-table tbody th[scope="row"] {
        text-align: left;
        white-space: normal;
        width: auto;
        min-width: calc(360 * var(--u));
        overflow: hidden;
        padding-left: calc(16 * var(--u));
        padding-right: calc(16 * var(--u));
    }

    .section-table thead th {
        font-size: var(--h4-size);
        line-height: var(--h5-line-height); 
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
        background: transparent;
        color: var(--color-black);
        border-bottom: 1px solid var(--color-black);
        padding: calc(14 * var(--u)) calc(16 * var(--u));
    }

    .section-table:not(.flex-table) thead th:first-child {
        width: 28%;
    }

    .section-table tbody > tr > th,
    .section-table tbody > tr > td {
        background: var(--color-background);
        font-weight: var(--h5-weight);
        transition: filter 150ms ease;
    }

    .section-table tbody > tr:hover > th,
    .section-table tbody > tr:hover > td {
        filter: brightness(0.975);
    }

    .subsection {
        margin-top: calc(40 * var(--u));
        padding-top: calc(30 * var(--u));
        border-top: calc(8 * var(--u)) solid var(--color-background);
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
