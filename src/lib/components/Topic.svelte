<script lang="ts">
    import { marked } from "marked";
    import { slide } from "svelte/transition";
    import arrowIconSmall from "$lib/assets/arrowIconSmall.png";
    import CompetenceModal from "$lib/components/CompetenceModal.svelte";
    import Referenze from "$lib/components/Referenze.svelte";
    import diceCube from "$lib/assets/dice-cube-outline.png";
    import {
        getAdditionalTopicDescription,
        getAllAspects,
        getAllCompetences,
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

    const hasAspectMinimums = $derived(
        topic.min_social_aspects != null ||
            topic.min_language_modes != null ||
            topic.min_key_competences != null,
    );

    const aspectMinimumsByTitle: Record<string, number | undefined> = $derived({
        "Gesellschaftliche Inhalte": topic.min_social_aspects,
        Sprachmodi: topic.min_language_modes,
        Schlüsselkompetenzen: topic.min_key_competences,
    });

    const aspectCompetences = $derived(
        getAllAspects().map((aspect) => ({
            aspect,
            minimum: aspectMinimumsByTitle[aspect.title],
            competences: getAllCompetences()
                .filter((c) => c.aspect === aspect.title)
                .sort((a, b) => a.title.localeCompare(b.title, "de-CH")),
        })),
    );

    let rolledAspects = $state(new Map<string, Set<string>>());

    const rollAspect = (
        aspectTitle: string,
        competences: Competence[],
        minimum: number | undefined,
    ) => {
        const next = new Map(rolledAspects);
        if (next.has(aspectTitle)) {
            next.delete(aspectTitle);
        } else {
            const count = minimum ?? 0;
            if (count <= 0) return;
            const slugs = new Set(
                [...competences]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, count)
                    .map((c) => c.slug),
            );
            next.set(aspectTitle, slugs);
        }
        rolledAspects = next;
    };

    const isAspectDimmed = (aspectTitle: string, slug: string) => {
        const selection = rolledAspects.get(aspectTitle);
        return selection !== undefined && !selection.has(slug);
    };
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
                        <h4 class="additional-description-title">
                            Detaillierte Erweiterung
                        </h4>
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
        {#if hasAspectMinimums}
            <div class="aspect-minimums">
                {#each aspectCompetences as group}
                    <div class="aspect-section">
                        <div class="aspect-section-header">
                            <h2 class="section-label">
                                Mögliche {group.aspect.title}{group.minimum !=
                                null
                                    ? ` (Mindestens ${group.minimum})`
                                    : ""}
                            </h2>
                            {#if group.minimum != null}
                                <button
                                    type="button"
                                    class="dice-button"
                                    class:is-active={rolledAspects.has(
                                        group.aspect.title,
                                    )}
                                    aria-pressed={rolledAspects.has(
                                        group.aspect.title,
                                    )}
                                    aria-label="Zufällige Auswahl würfeln"
                                    onclick={() =>
                                        rollAspect(
                                            group.aspect.title,
                                            group.competences,
                                            group.minimum,
                                        )}
                                >
                                    <img
                                        src={diceCube}
                                        alt=""
                                        class="dice-icon"
                                    />
                                </button>
                            {/if}
                        </div>
                        <div class="tag-list">
                            {#each group.competences as competence}
                                <button
                                    type="button"
                                    class="tag"
                                    class:dimmed={isAspectDimmed(
                                        group.aspect.title,
                                        competence.slug,
                                    )}
                                    style={`--tag-color: ${competence.color ?? "#64748b"}`}
                                    onclick={() =>
                                        (selectedCompetence = competence)}
                                    >{competence.title}</button
                                >
                            {/each}
                        </div>
                    </div>
                {/each}
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

    .aspect-minimums {
        margin-top: 100px;
        display: flex;
        flex-direction: column;
        gap: 40px;
    }

    .aspect-section-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.35rem;
    }

    .aspect-section-header .section-label {
        margin-bottom: 0;
    }

    .dice-button {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 9999px;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        transition: background-color 120ms ease;
    }

    .dice-button:hover {
        animation: shake 3s ease-in-out infinite;
    }

    .dice-button.is-active {
        /* background: var(--color-black); */
        /* box-shadow: 0 9px 15px rgba(0, 0, 0, 0.25); */
    }

    .dice-icon {
        width: 20px;
        height: 20px;
        display: block;
    }

    @keyframes shake {
        0%,
        18%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        3% {
            transform: rotate(-1deg) translateX(-5px);
        }
        6% {
            transform: rotate(1deg) translateX(5px);
        }
        9% {
            transform: rotate(-0.75deg) translateX(-5px);
        }
        12% {
            transform: rotate(0.75deg) translateX(5px);
        }
        15% {
            transform: rotate(0deg) translateX(0);
        }
    }

    .aspect-section {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    :global(.tag).dimmed {
        opacity: 0.2;
        pointer-events: none;
    }
</style>
