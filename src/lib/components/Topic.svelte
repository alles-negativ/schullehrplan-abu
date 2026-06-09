<script lang="ts">
    import { marked } from "marked";
    import { slide } from "svelte/transition";
    import arrowIconSmall from "$lib/assets/arrowIconSmall.png";
    import CompetenceModal from "$lib/components/CompetenceModal.svelte";
    import Referenze from "$lib/components/Referenze.svelte";
    import {
        getAdditionalTopicDescription,
        getCompetenceBySlug,
        getTopicCoreContents,
        getTopicDescription,
        getTopicTitle,
        type Competence,
        type Topic,
    } from "$lib/data/education-modes";

    let {
        topic,
        yearLabel,
    }: {
        topic: Topic;
        yearLabel: string;
    } = $props();

    let extensionExpanded = $state(false);

    const essentialCompetences = $derived(
        (topic.essential_competences ?? [])
            .map((slug) => getCompetenceBySlug(slug))
            .filter((entry): entry is Competence => Boolean(entry)),
    );

    let selectedCompetence = $state<Competence | null>(null);
</script>

<article class="topic">
    <div class="content-wrap">
        <h1 class="topic-title">
            {#if topic.number != null}
                {topic.number}.
            {/if}
            {getTopicTitle(topic)}
        </h1>
        {#if getTopicDescription(topic)}
            <div class="description">
                {@html marked.parse(getTopicDescription(topic) ?? "") as string}
            </div>
        {/if}
        {#if getAdditionalTopicDescription(topic)}
            <section class="detailed-extension">
                {#if extensionExpanded}
                    <div
                        class="additional-description"
                        transition:slide={{
                            duration: 220,
                            easing: (t) => t * (2 - t),
                        }}
                    >
                        <h3 class="additional-description-title">
                            Detaillierte Erweiterung
                        </h3>
                        {@html marked.parse(
                            getAdditionalTopicDescription(topic) ?? "",
                        ) as string}
                    </div>
                {/if}
                <button
                    type="button"
                    class="detailed-extension-toggle"
                    class:is-expanded={extensionExpanded}
                    aria-expanded={extensionExpanded}
                    aria-label={extensionExpanded
                        ? "Detaillierte Erweiterung ausblenden"
                        : "Detaillierte Erweiterung anzeigen"}
                    onclick={() => (extensionExpanded = !extensionExpanded)}
                >
                    <span class="detailed-extension-icon-wrap">
                        <img
                            src={arrowIconSmall}
                            alt=""
                            class="detailed-extension-icon"
                        />
                    </span>
                    <span class="detailed-extension-label"
                        >{extensionExpanded
                            ? "Detaillierte Erweiterung ausblenden"
                            : "Detaillierte Erweiterung anzeigen"}</span
                    >
                </button>
            </section>
        {/if}
        {#if getTopicCoreContents(topic)}
            <div class="kerninhalte">
                <h2 class="section-label">Kerninhalte</h2>
                <p class="kerninhalte-text">{getTopicCoreContents(topic)}</p>
            </div>
        {/if}
        {#if essentialCompetences.length > 0}
            <div class="competence-tags">
                <h2 class="section-label">Schlüsselkompetenzen</h2>
                <div class="tag-list">
                    {#each essentialCompetences as item}
                        <button
                            type="button"
                            class="tag"
                            style={`--tag-color: ${item.color ?? "#64748b"}`}
                            onclick={() => (selectedCompetence = item)}
                            >{item.title}</button
                        >
                    {/each}
                </div>
            </div>
        {/if}
    </div>
    <Referenze
        references={topic.individual_reference ?? []}
        topicNumber={topic.number}
    />
</article>

<CompetenceModal bind:competence={selectedCompetence} />

<style>
    .content-wrap {
        margin: 0 33px;
    }

    .description {
        margin-top: 1.2rem;
    }

    .description :global(p) {
        margin: 0 0 40px;
    }

    .detailed-extension {
        margin-top: 1.5rem;
    }

    .additional-description :global(p) {
        margin: 0 0 1.25rem;
        font-size: var(--p-size);
        line-height: var(--p-line-height);
        font-weight: var(--p-weight);
        letter-spacing: var(--p-letter-spacing);
    }

    .detailed-extension-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        border: 0;
        padding: 0;
        background: transparent;
        cursor: pointer;
        text-align: left;
    }

    .detailed-extension-icon-wrap {
        flex-shrink: 0;
        box-sizing: border-box;
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: var(--color-darkblue);
        border: 1.5px solid var(--color-black);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        transform: rotate(180deg);
        transition: transform 120ms ease;
    }

    .detailed-extension-toggle.is-expanded .detailed-extension-icon-wrap {
        transform: rotate(0deg);
    }

    .detailed-extension-icon {
        width: 9px;
        height: 12px;
        display: block;
    }

    .detailed-extension-label {
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        color: var(--color-black);
    }

    .kerninhalte {
        margin-top: 80px;
    }

    .competence-tags {
        margin-top: 40px;
    }

    .section-label {
        margin: 0 0 0.35rem;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
        color: #2f2f33;
    }

    .kerninhalte-text {
        margin: 0;
        /* font-size: var(--body-size);
        line-height: var(--body-line-height);
        font-weight: var(--body-weight);
        letter-spacing: var(--body-letter-spacing);
        color: var(--color-black); */
    }

    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
    }

    /* .tag {
        display: block;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        background: color-mix(in srgb, var(--tag-color) 18%, white);
        border: 1px solid color-mix(in srgb, var(--tag-color) 45%, #94a3b8);
        color: #0f172a;
        width: fit-content;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
    } */

</style>
