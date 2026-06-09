<script lang="ts">
    import { marked } from "marked";
    import CompetenceModal from "$lib/components/CompetenceModal.svelte";
    import {
        getAspectSlug,
        getAspectSpecification,
        getCompetenceBySlug,
        type Competence,
        type LearningContent,
    } from "$lib/data/education-modes";

    type AspectDisplay = Competence & { specification?: string };

    let {
        content,
        topicNumber,
        referenceNumber,
    }: {
        content: LearningContent;
        topicNumber?: number;
        referenceNumber?: number;
    } = $props();

    const title = $derived(content.titel ?? content.title ?? "");
    const html = $derived(marked.parse(title) as string);
    const mapAspects = (
        entries: LearningContent["social_aspects"],
    ): AspectDisplay[] => {
        const result: AspectDisplay[] = [];
        for (const entry of entries ?? []) {
            const competence = getCompetenceBySlug(getAspectSlug(entry));
            if (!competence) continue;
            result.push({
                ...competence,
                specification: getAspectSpecification(entry),
            });
        }
        return result;
    };

    const socialAspects = $derived(mapAspects(content.social_aspects));
    const languageAspects = $derived(mapAspects(content.language_aspects));
    let selectedCompetence = $state<AspectDisplay | null>(null);
</script>

<li class="content-item">
    <div class="line-container">
        <div class="line"></div>
    </div>
    <div class="content-body">
        {#if content.number != null}
            <p class="content-label">
                {topicNumber}.{referenceNumber}.{content.number}
            </p>
        {/if}
        <!-- Content is authored in CMS markdown -->
        <div class="content-text">{@html html}</div>
        <div class="content-tags">
            {#if socialAspects.length > 0}
                <div class="tag-group">
                    <span class="tag-group-label"
                        >Gesellschaftliche Inhalte</span
                    >
                    {#each socialAspects as item}
                        <div
                            class="aspect-item"
                            style={`--tag-color: ${item.color ?? "#64748b"}`}
                        >
                            <button
                                type="button"
                                class="tag"
                                onclick={() => (selectedCompetence = item)}
                                >{item.title}</button
                            >
                            {#if item.specification}
                                <p class="tag-specification">
                                    <span class="tag-specification-text">
                                        <span
                                            class="tag-specification-glow"
                                            aria-hidden="true"
                                            >{item.specification}</span
                                        >
                                        <span class="tag-specification-label"
                                            >{item.specification}</span
                                        >
                                    </span>
                                </p>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
            {#if languageAspects.length > 0}
                <div class="tag-group">
                    <span class="tag-group-label"
                        >Sprache und Kommunikation</span
                    >
                    {#each languageAspects as item}
                        <div
                            class="aspect-item"
                            style={`--tag-color: ${item.color ?? "#64748b"}`}
                        >
                            <button
                                type="button"
                                class="tag"
                                onclick={() => (selectedCompetence = item)}
                                >{item.title}</button
                            >
                            {#if item.specification}
                                <p class="tag-specification">
                                    <span class="tag-specification-text">
                                        <span
                                            class="tag-specification-glow"
                                            aria-hidden="true"
                                            >{item.specification}</span
                                        >
                                        <span class="tag-specification-label"
                                            >{item.specification}</span
                                        >
                                    </span>
                                </p>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</li>

<CompetenceModal bind:competence={selectedCompetence} />

<style>
    .content-item {
        margin: 0px 0 80px 0;
    }
    .content-item:last-child {
        margin-bottom: 0px;
    }

    .content-text :global(p) {
        margin: 0;
        font-size: var(--p-size);
        line-height: var(--p-line-height);
        font-weight: var(--p-weight);
        letter-spacing: var(--p-letter-spacing);
    }

    .content-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .content-label {
        margin: 0;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        color: var(--color-black);
    }

    .content-tags {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 60px;
        align-items: flex-start;
        justify-content: flex-start;
        margin-top: 30px;
    }

    .tag-group {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 0.2rem;
        min-width: 10.5rem;
        flex: 1 1 10.5rem;
    }

    .aspect-item {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        align-items: flex-start;
    }

    .tag-group-label {
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
        color: #2f2f33;
    }

    /* .tag {
        display: block;
        padding: 6px 15px;
        border-radius: 999px;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        background: var(--tag-color);
        border: 1px solid var(--color-black);
        color: var(--color-black);
        width: fit-content;
        max-width: 100%;
        cursor: pointer;
    } */

    .tag-specification {
        margin: 0;
        margin-left: 7px;
        color: var(--color-black);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: 400;
        letter-spacing: var(--h6-letter-spacing);
    }

    .tag-specification-text {
        display: inline-grid;
        vertical-align: top;
    }

    .tag-specification-glow,
    .tag-specification-label {
        grid-area: 1 / 1;
        font-size: inherit;
        line-height: inherit;
        font-weight: inherit;
        letter-spacing: inherit;
    }

    .tag-specification-glow {
        color: var(--tag-color, #64748b);
        opacity: 1;
        filter: blur(15px);
        user-select: none;
        pointer-events: none;
        font-weight: 900;
    }

    .tag-specification-label {
        color: var(--color-black);
    }

    .line {
        width: 100%;
        height: 8px;
        background: var(--color-background);
        margin: 35px 0 35px 0;
    }
</style>
