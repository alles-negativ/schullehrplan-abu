<script lang="ts">
    import CompetenceModal from "$lib/components/CompetenceModal.svelte";
    import {
        getAllCompetences,
        getAspectByTitle,
        getAspectSlug,
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

    const aspectOrder = [
        "Gesellschaftliche Aspekte",
        "Sprache und Kommunikation",
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

    const hasActiveFilter = $derived(
        highlightedCompetenceSlug != null || highlightedAspectTitle != null,
    );

    const isCompetenceVisible = (competence: Competence | null | undefined) => {
        if (!competence || !hasActiveFilter) return false;
        if (highlightedCompetenceSlug) {
            return competence.slug === highlightedCompetenceSlug;
        }
        if (highlightedAspectTitle) {
            return competence.aspect === highlightedAspectTitle;
        }
        return false;
    };

    const collectReferenceSlugs = (
        reference: NonNullable<Topic["individual_reference"]>[number],
    ) => {
        const slugs = new Set<string>(reference.essential_competences ?? []);
        for (const content of reference.learning_contents ?? []) {
            for (const entry of content.social_aspects ?? [])
                slugs.add(getAspectSlug(entry));
            for (const entry of content.language_aspects ?? [])
                slugs.add(getAspectSlug(entry));
            for (const slug of content.essential_competences ?? [])
                slugs.add(slug);
        }
        return slugs;
    };

    const isSchluesselkompetenz = (competence: Competence) =>
        competence.aspect === "Schlüsselkompetenzen";

    const uniqueSlugs = (slugs: Iterable<string>) =>
        slugs instanceof Set ? slugs : new Set(slugs);

    const slugsToCompetences = (slugs: Iterable<string>) =>
        Array.from(uniqueSlugs(slugs))
            .map((slug) => getCompetenceBySlug(slug))
            .filter((entry): entry is Competence => entry != null);

    const slugsToReferenceCompetences = (slugs: Iterable<string>) =>
        slugsToCompetences(slugs).filter(
            (competence) => !isSchluesselkompetenz(competence),
        );

    const addCompetenceCounts = (
        counts: Map<string, number>,
        competences: Competence[],
    ) => {
        for (const competence of competences) {
            counts.set(competence.slug, (counts.get(competence.slug) ?? 0) + 1);
        }
    };

    const competenceCountBySlug = $derived.by(() => {
        const counts = new Map<string, number>();

        for (const year of years) {
            for (const topic of year.themenbereiche ?? []) {
                addCompetenceCounts(
                    counts,
                    slugsToCompetences(topic.essential_competences ?? []),
                );
                for (const reference of topic.individual_reference ?? []) {
                    addCompetenceCounts(
                        counts,
                        slugsToReferenceCompetences(
                            collectReferenceSlugs(reference),
                        ),
                    );
                }
            }
        }

        return counts;
    });

    const getTopicCompetences = (topic: Topic) =>
        slugsToCompetences(topic.essential_competences ?? []);

    const getReferenceCompetences = (topic: Topic) =>
        (topic.individual_reference ?? []).map((reference) =>
            slugsToReferenceCompetences(collectReferenceSlugs(reference)),
        );

    const getReferenceLabel = (
        topic: Topic,
        reference: NonNullable<Topic["individual_reference"]>[number],
    ) => {
        if (topic.number != null && reference.number != null) {
            return `${topic.number}.${reference.number}`;
        }
        return "";
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
                            class:is-active={isCompetenceHighlighted(
                                competence,
                            )}
                            style={`--pill-color: ${competence.color ?? "#64748b"}`}
                            onclick={() =>
                                toggleCompetenceHighlight(competence.slug)}
                        >
                            {competence.title} ({competenceCountBySlug.get(
                                competence.slug,
                            ) ?? 0})
                        </button>
                    {/each}
                </div>
            </article>
        {/each}
    </div>

    <div class="years">
        {#each years as year}
            <section class="year-section">
                <div class="year-header">
                    <h5>{getYearLabel(year)}. Lehrjahr</h5>
                    <h5 class="year-column-label">Kompetenzkategorien</h5>
                </div>
                <div class="topic-list">
                    {#each year.themenbereiche ?? [] as topic}
                        {@const topicCompetences = getTopicCompetences(topic)}
                        {@const referenceCompetences =
                            getReferenceCompetences(topic)}
                        <article class="topic-card">
                            <div class="list-row topic-row">
                                <div class="row-content">
                                    <h3 class="topic-card-title">
                                        {#if topic.number != null}
                                            {topic.number}.
                                        {/if}
                                        {getTopicTitle(topic)}
                                    </h3>
                                </div>
                                <div class="row-tags">
                                    {#each topicCompetences as competence}
                                        {#if isCompetenceVisible(competence)}
                                            <button
                                                type="button"
                                                class="pill list-pill pill-button"
                                                class:is-active={isCompetenceHighlighted(
                                                    competence,
                                                )}
                                                style={`--pill-color: ${competence.color ?? "#64748b"}`}
                                                onclick={() =>
                                                    (selectedCompetence =
                                                        competence)}
                                                >{competence.title}</button
                                            >
                                        {/if}
                                    {/each}
                                </div>
                            </div>

                            {#each topic.individual_reference ?? [] as reference, index}
                                {@const competenceItems =
                                    referenceCompetences[index] ?? []}
                                {@const referenceLabel = getReferenceLabel(
                                    topic,
                                    reference,
                                )}
                                <div class="list-row reference-row">
                                    <div class="row-content">
                                        {#if referenceLabel}
                                            <span class="reference-number"
                                                >{referenceLabel}</span
                                            >
                                        {/if}
                                        {#if reference.title ?? reference.titel}
                                            <span class="reference-text"
                                                >{reference.title ??
                                                    reference.titel}</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="row-tags">
                                        {#each competenceItems as competence}
                                            {#if isCompetenceVisible(competence)}
                                                <button
                                                    type="button"
                                                    class="pill list-pill pill-button"
                                                    class:is-active={isCompetenceHighlighted(
                                                        competence,
                                                    )}
                                                    style={`--pill-color: ${competence.color ?? "#64748b"}`}
                                                    onclick={() =>
                                                        (selectedCompetence =
                                                            competence)}
                                                    >{competence.title}</button
                                                >
                                            {/if}
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        </article>
                    {/each}
                </div>
            </section>
        {/each}
    </div>
</section>

<CompetenceModal bind:competence={selectedCompetence} />

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
        margin: 0 0 35px;
        border: 2px solid var(--color-black);
        border-radius: 999px;
        padding: 0;
        text-align: center;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        background: var(--aspect-color);
        color: var(--color-black);
        width: 100%;
        cursor: pointer;
        height: 120px;
        transition: all 120ms ease;
    }

    .aspect-title-button.is-active,
    .aspect-title-button:hover {
        box-shadow: 0px 7px 0px var(--color-black);
        transform: translateY(-7px);
    }

    .pill-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .pill {
        display: inline-flex;
        align-items: center;
        padding: 5px 15px;
        border-radius: 999px;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        background: var(--color-white);
        border: 1px solid var(--color-black);
        width: fit-content;
        max-width: 100%;
        cursor: pointer;
    }

    .pill.is-active,
    .pill:hover {
        background: var(--pill-color);
    }

    .pill.is-active:hover {
        filter: brightness(1.1);
    }

    .years {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
    }

    .year-header {
        display: grid;
        grid-template-columns: 1fr minmax(14rem, 28rem);
        align-items: end;
        margin: 10px 25px;
    }

    .year-header h5 {
        margin: 0;
    }

    .year-column-label {
        justify-self: end;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        text-align: right;
    }

    .topic-list {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .topic-card {
        background: var(--color-white);
        border-radius: 25px;
        padding: 35px 40px;
    }

    .topic-card-title {
        margin: 0;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        margin-left: -33px;
    }

    .list-row {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 1.5rem;
        padding: 0.85rem 0;
        border-top: 5px solid var(--color-background);
        margin-left: 35px;
        position: relative;
    }

    .topic-row {
        border-top: 0;
        padding-top: 0;
    }

    .row-content {
        display: flex;
        flex: 1 1 auto;
        gap: 0.35rem;
        min-width: 0;
        font-size: var(--body-size);
        line-height: var(--body-line-height);
        font-weight: var(--body-weight);
        letter-spacing: var(--body-letter-spacing);
        width: 50%;
    }

    .reference-number {
        flex: 0 0 auto;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        position: absolute;
        left: -40px;
        top: 18px;
    }

    .reference-text {
        min-width: 0;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
    }

    .row-tags {
        flex: 0 1 auto;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-end;
        align-items: center;
        margin-left: auto;
        width: 50%;
    }

    .list-pill {
        flex-shrink: 0;
        padding: 5px 15px;
        background: var(--pill-color);
        color: var(--color-black);
        white-space: nowrap;
    }

    .pill-button {
        cursor: pointer;
    }

    @media (max-width: 1100px) {
        .aspect-grid {
            grid-template-columns: 1fr;
        }

        .year-header {
            grid-template-columns: 1fr;
        }

        .year-column-label {
            justify-self: start;
            text-align: left;
        }

        .topic-card {
            padding: 1.25rem 1rem;
        }
    }
</style>
