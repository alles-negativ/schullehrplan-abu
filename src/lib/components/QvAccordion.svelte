<script lang="ts">
    import { marked } from "marked";
    import { slide } from "svelte/transition";
    import arrowIcon from "$lib/assets/arrow.svg";
    import { type QvSection } from "$lib/data/qv";

    let {
        sections,
    }: {
        sections: QvSection[];
    } = $props();

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
                <div class="section-header">
                    <div class="section-meta">
                        <div class="section-title">
                            {#if section.number}
                                <span class="section-heading"
                                    >{section.number}</span
                                >
                            {/if}
                            <span class="section-summary">{section.title}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="section-toggle"
                        class:is-expanded={isExpanded(index)}
                        aria-expanded={isExpanded(index)}
                        aria-label={isExpanded(index)
                            ? "Abschnitt ausblenden"
                            : "Abschnitt anzeigen"}
                        onclick={() => toggleSection(index)}
                    >
                        <img
                            src={arrowIcon}
                            alt=""
                            class="section-toggle-icon"
                        />
                    </button>
                </div>

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

                        {#each section.lists ?? [] as list}
                            <div class="section-list-block">
                                {#if list.title}
                                    <h4 class="list-label">{list.title}</h4>
                                {/if}
                                <ul class="section-list">
                                    {#each list.items as item}
                                        <li>{item}</li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}

                        {#each section.tables ?? [] as table}
                            <div class="section-table-block">
                                {#if table.caption}
                                    <p class="table-caption">{table.caption}</p>
                                {/if}
                                <table class="section-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">
                                                {table.column_label ?? "Teil"}
                                            </th>
                                            <th scope="col">
                                                {table.column_description ??
                                                    "Inhalt / Beschreibung"}
                                            </th>
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
                        {/each}

                        {#each section.subsections ?? [] as subsection}
                            <div class="subsection">
                                <h4 class="subsection-title">
                                    {#if subsection.number}
                                        <span class="subsection-heading"
                                            >{subsection.number}</span
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
        position: relative;
    }

    .section-meta {
        min-width: 0;
        padding-right: 3.1rem;
    }

    .section-heading {
        display: block;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
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

    .section-toggle {
        position: absolute;
        top: -2px;
        right: 0;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        width: 52px;
        height: 52px;
        display: inline-grid;
        place-items: center;
        background: var(--color-darkblue);
        padding: 0;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            filter 60ms ease;
    }

    .section-toggle:hover {
        filter: brightness(1.2);
    }

    .section-toggle-icon {
        height: 30px;
        display: block;
        transform: rotate(180deg);
        transition: transform 120ms ease;
    }

    .section-toggle.is-expanded .section-toggle-icon {
        transform: rotate(0deg);
    }

    .section-body {
        margin-top: 1.5rem;
    }

    .section-text :global(p),
    .subsection-text :global(p) {
        margin: 0 0 1rem;
        font-size: var(--p-size);
        line-height: var(--p-line-height);
        font-weight: var(--p-weight);
        letter-spacing: var(--p-letter-spacing);
    }

    .section-text :global(p:last-child),
    .subsection-text :global(p:last-child) {
        margin-bottom: 0;
    }

    .section-list-block {
        margin-top: 1.5rem;
    }

    .list-label {
        margin: 0 0 0.35rem;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
        color: #2f2f33;
    }

    .section-list {
        margin: 0;
        padding-left: 1.5rem;
    }

    .section-list li + li {
        margin-top: 0.35rem;
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
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1.5px solid var(--color-black);
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
        margin-top: 5px;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
        color: var(--color-black);
    }

    .subsection-title {
        margin: 0 0 0.75rem;
    }
</style>
