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

                {#if data.impressum.content_before_image}
                    <div class="impressum-content">
                        {@html marked.parse(
                            data.impressum.content_before_image,
                        ) as string}
                    </div>
                {/if}

                {#if data.impressum.image}
                    <figure class="impressum-image-wrap">
                        <img
                            src={data.impressum.image}
                            alt={data.impressum.image_alt ?? ""}
                            class="impressum-image"
                        />
                        {#if data.impressum.image_caption}
                            <figcaption class="impressum-image-text">
                                {@html marked.parseInline(
                                    data.impressum.image_caption,
                                ) as string}
                            </figcaption>
                        {/if}
                    </figure>
                {/if}

                {#if data.impressum.content_after_image}
                    <div
                        class="impressum-content impressum-content-after-image"
                    >
                        {@html marked.parse(
                            data.impressum.content_after_image,
                        ) as string}
                    </div>
                {:else if data.impressum.content}
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

    .impressum-image-wrap {
        margin: 0;
        /* padding: 0 calc(33 * var(--u)); */
    }

    .impressum-image {
        display: block;
        width: 100%;
        margin-top: calc(40 * var(--u));
    }

    .impressum-image-text {
        margin: calc(20 * var(--u)) 0 0;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
    }

    .impressum-image-text :global(a) {
        color: var(--color-black);
        border-bottom: 2px solid var(--color-black);
        transition:
            color 900ms ease,
            border-bottom-color 900ms ease;
    }

    .impressum-image-text :global(a:hover) {
        color: var(--color-selection-snap);
        border-bottom-color: var(--color-selection-snap);
    }

    .impressum-content {
        margin-top: calc(80 * var(--u));
    }

    .impressum-content-after-image {
        margin-top: calc(50 * var(--u));
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
        transition:
            color 900ms ease,
            border-bottom-color 900ms ease;
    }

    .impressum-content :global(a:hover) {
        color: var(--color-selection-snap);
        border-bottom-color: var(--color-selection-snap);
    }

    @media (prefers-reduced-motion: reduce) {
        .impressum-image-text :global(a),
        .impressum-content :global(a) {
            transition: none;
        }
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

        .impressum-image-wrap {
            padding: 0;
        }
    }
</style>
