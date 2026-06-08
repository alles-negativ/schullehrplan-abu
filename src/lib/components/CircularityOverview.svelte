<script lang="ts">
    import { marked } from "marked";
    import {
        getAllCompetences,
        getAspectByTitle,
        getCompetenceBySlug,
        getModeYears,
        getTopicTitle,
        getYearLabel,
        type EducationMode,
        type Competence,
        type Topic,
    } from "$lib/data/education-modes";

    let { mode }: { mode: EducationMode } = $props();
    const years = $derived(getModeYears(mode));
    let selectedCompetence = $state<Competence | null>(null);
    let highlightedCompetenceSlug = $state<string | null>(null);
    let highlightedAspectTitle = $state<string | null>(null);

    type AspectGroup = {
        title: string;
        competences: Competence[];
    };

    const closeCompetenceModal = () => (selectedCompetence = null);
    const onBackdropKeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            closeCompetenceModal();
        }
    };
    const onBackdropClick = (event: MouseEvent) => {
        if (event.target === event.currentTarget) {
            closeCompetenceModal();
        }
    };

    const aspectOrder = [
        "Gesellschaftliche Aspekte",
        "Sprachmodi",
        "Schlüsselkompetenzen",
    ] as const;

    const aspectGroups = $derived.by<AspectGroup[]>(() => {
        const byAspect = new Map<string, Competence[]>();
        for (const competence of getAllCompetences()) {
            if (!competence.aspect) continue;
            const list = byAspect.get(competence.aspect) ?? [];
            list.push(competence);
            byAspect.set(competence.aspect, list);
        }

        return aspectOrder.map((title) => ({
            title,
            competences: (byAspect.get(title) ?? []).sort((a, b) =>
                a.title.localeCompare(b.title, "de-CH"),
            ),
        }));
    });

    const getAspectColor = (aspectTitle: string) =>
        getAspectByTitle(aspectTitle)?.color ?? "#64748b";

    const isAspectHighlighted = (aspectTitle: string) =>
        highlightedAspectTitle === aspectTitle;

    const isCompetenceHighlighted = (competence: Competence) => {
        if (highlightedCompetenceSlug) {
            return competence.slug === highlightedCompetenceSlug;
        }
        if (highlightedAspectTitle) {
            return competence.aspect === highlightedAspectTitle;
        }
        return false;
    };

    const toggleAspectHighlight = (aspectTitle: string) => {
        if (highlightedAspectTitle === aspectTitle) {
            highlightedAspectTitle = null;
            return;
        }
        highlightedAspectTitle = aspectTitle;
        highlightedCompetenceSlug = null;
    };

    const toggleCompetenceHighlight = (slug: string) => {
        if (highlightedCompetenceSlug === slug) {
            highlightedCompetenceSlug = null;
            return;
        }
        highlightedCompetenceSlug = slug;
        highlightedAspectTitle = null;
    };

    const competenceCountBySlug = $derived.by(() => {
        const counts = new Map<string, number>();
        const addSlug = (
            slug: string | undefined,
            source: "topic" | "reference",
        ) => {
            if (!slug) return;
            const competence = getCompetenceBySlug(slug);
            if (
                source === "reference" &&
                competence?.aspect === "Schlüsselkompetenzen"
            ) {
                return;
            }
            counts.set(slug, (counts.get(slug) ?? 0) + 1);
        };

        for (const year of years) {
            for (const topic of year.themenbereiche ?? []) {
                for (const slug of topic.essential_competences ?? [])
                    addSlug(slug, "topic");
                for (const reference of topic.individual_reference ?? []) {
                    for (const slug of reference.essential_competences ?? [])
                        addSlug(slug, "reference");
                    for (const content of reference.learning_contents ?? []) {
                        for (const slug of content.social_aspects ?? [])
                            addSlug(slug, "reference");
                        for (const slug of content.language_aspects ?? [])
                            addSlug(slug, "reference");
                        for (const slug of content.essential_competences ?? [])
                            addSlug(slug, "reference");
                    }
                }
            }
        }

        return counts;
    });

    const getReferenceCompetences = (topic: Topic) =>
        (topic.individual_reference ?? []).map((reference) => {
            const slugs = new Set<string>(reference.essential_competences ?? []);
            for (const content of reference.learning_contents ?? []) {
                for (const slug of content.social_aspects ?? []) slugs.add(slug);
                for (const slug of content.language_aspects ?? []) slugs.add(slug);
                for (const slug of content.essential_competences ?? [])
                    slugs.add(slug);
            }
            return Array.from(slugs)
                .map((slug) => getCompetenceBySlug(slug))
                .filter(
                    (entry): entry is Competence =>
                        entry != null &&
                        entry.aspect !== "Schlüsselkompetenzen",
                );
        });

    const getReferenceTitle = (topic: Topic, index: number): string => {
        const reference = topic.individual_reference?.[index];
        if (!reference) return "";
        return reference.title ?? reference.titel ?? "";
    };
</script>

<section class="circularity">
    <div class="aspect-grid">
        {#each aspectGroups as group}
            <article class="aspect-column">
                <button
                    type="button"
                    class="aspect-title-button"
                    class:is-active={isAspectHighlighted(group.title)}
                    style={`--aspect-color: ${getAspectColor(group.title)}`}
                    onclick={() => toggleAspectHighlight(group.title)}
                >
                    {group.title}
                </button>
                <div class="pill-wrap">
                    {#each group.competences as competence}
                        <button
                            type="button"
                            class="pill pill-button"
                            class:is-active={isCompetenceHighlighted(competence)}
                            style={`--pill-color: ${competence.color ?? "#64748b"}`}
                            onclick={() => toggleCompetenceHighlight(competence.slug)}
                        >
                            {competence.title} ({competenceCountBySlug.get(competence.slug) ?? 0})
                        </button>
                    {/each}
                </div>
            </article>
        {/each}
    </div>

    <div class="years">
        {#each years as year}
            <section class="year-section">
                <h2>{getYearLabel(year)}. Lehrjahr</h2>
                <div class="topic-list">
                    {#each year.themenbereiche ?? [] as topic}
                        {@const references = getReferenceCompetences(topic)}
                        <article class="topic-row">
                            <div class="topic-title">
                                {#if topic.number != null}
                                    {topic.number}.
                                {/if}
                                {getTopicTitle(topic)}
                            </div>
                            <div class="topic-tags">
                                {#each topic.essential_competences ?? [] as slug}
                                    {@const competence = getCompetenceBySlug(slug)}
                                    {#if competence}
                                        <button
                                            type="button"
                                            class="pill compact pill-button"
                                            class:is-active={isCompetenceHighlighted(
                                                competence,
                                            )}
                                            style={`--pill-color: ${competence.color ?? "#64748b"}`}
                                            onclick={() => (selectedCompetence = competence)}
                                            >{competence.title}</button
                                        >
                                    {/if}
                                {/each}
                            </div>
                        </article>

                        {#each references as competenceItems, index}
                            {@const title = getReferenceTitle(topic, index)}
                            {#if title || competenceItems.length > 0}
                                <div class="reference-row">
                                    <span>{title}</span>
                                    <div class="topic-tags">
                                        {#each competenceItems as competence}
                                            <button
                                                type="button"
                                                class="pill compact pill-button"
                                                class:is-active={isCompetenceHighlighted(
                                                    competence,
                                                )}
                                                style={`--pill-color: ${competence.color ?? "#64748b"}`}
                                                onclick={() =>
                                                    (selectedCompetence = competence)}
                                                >{competence.title}</button
                                            >
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {/each}
                </div>
            </section>
        {/each}
    </div>
</section>

{#if selectedCompetence}
    <div
        class="modal-backdrop"
        role="button"
        tabindex="0"
        aria-label="Kompetenz-Dialog schliessen"
        onclick={onBackdropClick}
        onkeydown={onBackdropKeydown}
    >
        <div
            class="modal-card"
            role="dialog"
            tabindex="-1"
            aria-modal="true"
            aria-label={`Kompetenz: ${selectedCompetence.title}`}
            style={`--modal-color: ${selectedCompetence.color ?? "#334155"}`}
        >
            <button class="modal-close" type="button" onclick={closeCompetenceModal}
                >Schliessen</button
            >
            <h4>{selectedCompetence.title}</h4>
            {#if selectedCompetence.aspect}
                <p class="modal-aspect">{selectedCompetence.aspect}</p>
            {/if}
            {#if selectedCompetence.description}
                <div class="modal-description">
                    {@html marked.parse(selectedCompetence.description) as string}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .circularity {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .aspect-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        align-items: start;
    }

    .aspect-title-button {
        margin: 0 0 0.75rem;
        border: 1px solid #64748b;
        border-radius: 999px;
        padding: 0.35rem 0.8rem;
        text-align: center;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
        background: #ffffff;
        color: #1f2937;
        width: 100%;
        cursor: pointer;
    }

    .aspect-title-button.is-active {
        background: color-mix(in srgb, var(--aspect-color) 20%, white);
        border-color: color-mix(in srgb, var(--aspect-color) 55%, #94a3b8);
    }

    .pill-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        padding: 0.2rem 0.65rem;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        white-space: nowrap;
    }

    .pill.is-active {
        border-color: color-mix(in srgb, var(--pill-color) 45%, #94a3b8);
        background: color-mix(in srgb, var(--pill-color) 20%, white);
    }

    .years {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .year-section h2 {
        margin: 0 0 0.6rem;
        border-bottom: 2px solid #334155;
        padding-bottom: 0.35rem;
    }

    .topic-list {
        display: flex;
        flex-direction: column;
    }

    .topic-row,
    .reference-row {
        border-bottom: 1px solid #cbd5e1;
        padding: 0.45rem 0;
        display: grid;
        grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 1fr);
        gap: 0.75rem;
        align-items: start;
    }

    .topic-title {
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
    }

    .reference-row {
        color: #334155;
        font-size: var(--body-size);
        line-height: var(--body-line-height);
        letter-spacing: var(--body-letter-spacing);
        padding-left: 1.6rem;
    }

    .topic-tags {
        justify-self: end;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        justify-content: flex-end;
        align-content: flex-start;
        align-items: flex-start;
        align-self: start;
    }

    .compact {
        padding: 0.2rem 0.65rem;
    }

    .pill-button {
        cursor: pointer;
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 1rem;
        z-index: 1000;
        border: 0;
        width: 100%;
        text-align: initial;
    }

    .modal-card {
        width: min(42rem, 100%);
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid color-mix(in srgb, var(--modal-color) 55%, #1f2937);
        background: color-mix(in srgb, var(--modal-color) 18%, white);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    .modal-close {
        float: right;
        border: 1px solid #64748b;
        border-radius: 0.45rem;
        background: #ffffff;
        padding: 0.25rem 0.6rem;
        cursor: pointer;
    }

    .modal-aspect {
        margin-top: 0.15rem;
        color: #334155;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
    }

    .modal-description :global(p) {
        margin: 0.5rem 0;
    }

    @media (max-width: 1100px) {
        .aspect-grid {
            grid-template-columns: 1fr;
        }

        .topic-row,
        .reference-row {
            grid-template-columns: 1fr;
        }

        .topic-tags {
            justify-self: start;
            justify-content: flex-start;
        }
    }
</style>
