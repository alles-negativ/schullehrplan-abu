<script lang="ts">
    import { getStatementContent } from "$lib/data/statement";

    const content = getStatementContent();
</script>

{#if content.title || content.lead || content.paragraphs.length > 0}
    <section class="director-statement" aria-label={content.title}>
        {#if content.title}
            <h2 class="director-statement-title">{content.title}</h2>
        {/if}

        <div class="director-statement-body">
            {#if content.image}
                <figure class="director-statement-portrait">
                    <img
                        src={content.image}
                        alt={content.image_alt}
                        width="455"
                        height="500"
                        loading="lazy"
                        decoding="async"
                    />
                </figure>
            {/if}

            <div class="director-statement-content">
                {#if content.lead}
                    <p class="director-statement-lead">{content.lead}</p>
                {/if}

                {#each content.paragraphs as paragraph}
                    <p>{paragraph}</p>
                {/each}
            </div>
        </div>
    </section>
{/if}

<style>
    .director-statement {
        width: min(100%, calc(1468 * var(--u)));
        margin-inline: auto;
        padding-inline: var(--grid-margin);
        padding-bottom: calc(120 * var(--u));
    }

    .director-statement-title {
        margin-top: calc(80 * var(--u));
        margin-bottom: calc(80 * var(--u));
        text-align: center;
        font-size: var(--h1-size);
        line-height: var(--h1-line-height);
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        text-wrap: balance;
        max-width: 70%;
        margin-inline: auto;
    }

    .director-statement-body {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: calc(80 * var(--u));
        align-items: start;
    }

    .director-statement-portrait {
        margin: 0;
        width: 100%;
        max-width: calc(500px / 1.1);
        aspect-ratio: 1 / 1.1;
    }

    .director-statement-portrait img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: calc(30 * var(--u));
    }

    .director-statement-content {
        min-width: 0;
    }

    .director-statement-lead {
        margin-bottom: calc(40 * var(--u));
        font-size: 60px;
        line-height: 1.2;
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        text-wrap: balance;
    }

    .director-statement-content :global(p + p) {
        margin-top: calc(28 * var(--u));
    }

    @media (max-width: 1100px) {
        .director-statement-body {
            grid-template-columns: 1fr;
            justify-items: center;
            /* gap: calc(40 * var(--u)); */
        }

        .director-statement-portrait {
            max-width: min(100%, calc(360 * var(--u)));
            margin-inline: auto;
        }

        .director-statement-content {
            width: 100%;
        }

        .director-statement-lead {
            font-size: clamp(28px, 5vw, var(--h1-size));
            line-height: 1.2;
            text-wrap: auto;
        }
    }
</style>
