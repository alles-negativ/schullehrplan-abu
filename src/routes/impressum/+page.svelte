<script lang="ts">
    import { marked } from "marked";

    let { data } = $props();
</script>

<svelte:head>
    <title>Schullehrplan ABU - {data.impressum.title}</title>
</svelte:head>

<div class="impressum-route mode-grid">
    <section class="topics-content">
        <article class="impressum">
            <div class="content-wrap">
                <h1 class="topic-title">{data.impressum.title}</h1>

                {#if data.impressum.content}
                    <div class="impressum-content">
                        {@html marked.parse(data.impressum.content) as string}
                    </div>
                {/if}
            </div>
        </article>
    </section>
</div>

<style>
    .mode-grid {
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 1fr) minmax(0, 10fr);
        column-gap: var(--grid-gutter);
        margin-top: calc(180 * var(--u));
        align-items: start;
    }

    .topics-content {
        grid-column: 3;
        min-width: 0;
        padding-bottom: 4rem;
    }

    .content-wrap {
        margin: 0 calc(33 * var(--u));
    }

    .impressum-content {
        margin-top: calc(80 * var(--u));
    }

    .impressum-content :global(h2) {
        margin: calc(50 * var(--u)) 0 0;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: 500;
        letter-spacing: var(--h2-letter-spacing);
    }

    .impressum-content :global(h2:first-child) {
        margin-top: 0;
    }

    .impressum-content :global(p) {
        margin: 0;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
    }

    .impressum-content :global(p + p) {
        margin-top: 1.25rem;
    }

    .impressum-content :global(strong) {
        font-weight: 600;
    }

    .impressum-content :global(a) {
        color: var(--color-black);
        border-bottom: 2px solid var(--color-black);
    }
    .impressum-content :global(a:hover) {
        color: var(--color-selection);
        border-bottom: 2px solid var(--color-selection);
    }

    @media (max-width: 1100px) {
        .impressum-route {
            width: 100%;
            margin-left: 0;
            margin-right: 0;
            grid-template-columns: minmax(0, 1fr);
        }

        .topics-content {
            grid-column: 1;
        }

        .content-wrap {
            margin-left: 0;
            margin-right: 0;
        }
    }
</style>
