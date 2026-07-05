<script lang="ts">
    import CompetenceModal from "$lib/components/CompetenceModal.svelte";
    import { tick } from "svelte";
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
    let selectedCompetenceSlugs = $state(new Set<string>());
    let yearsListEl = $state<HTMLElement | null>(null);
    let hasScrolledToList = $state(false);

    type AspectGroup = {
        title: string;
        competences: Competence[];
    };

    const aspectOrder = [
        "Gesellschaftliche Inhalte",
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

    // Keep "Schlüsselkompetenzen" on two lines ("Schlüssel" / "kompetenzen") — see
    // .aspect-title-button { white-space: pre-line }.
    const formatAspectTitle = (title: string) =>
        title === "Schlüsselkompetenzen" ? "Schlüssel\nkompetenzen" : title;

    const getAspectCompetenceSlugs = (aspectTitle: string) =>
        aspectGroups
            .find((group) => group.title === aspectTitle)
            ?.competences.map((competence) => competence.slug) ?? [];

    const isCompetenceSelected = (competence: Competence) =>
        selectedCompetenceSlugs.has(competence.slug);

    const isAspectFullySelected = (aspectTitle: string) => {
        const slugs = getAspectCompetenceSlugs(aspectTitle);
        return (
            slugs.length > 0 &&
            slugs.every((slug) => selectedCompetenceSlugs.has(slug))
        );
    };

    const maybeScrollToYearsList = async (activating: boolean) => {
        if (!activating || hasScrolledToList || !yearsListEl) return;

        hasScrolledToList = true;
        await tick();

        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth";
        yearsListEl.scrollIntoView({ behavior, block: "start" });
    };

    const toggleAspectSelection = (aspectTitle: string) => {
        const slugs = getAspectCompetenceSlugs(aspectTitle);
        if (slugs.length === 0) return;

        const wasEmpty = selectedCompetenceSlugs.size === 0;
        const next = new Set(selectedCompetenceSlugs);
        const allSelected = slugs.every((slug) => next.has(slug));

        for (const slug of slugs) {
            if (allSelected) {
                next.delete(slug);
            } else {
                next.add(slug);
            }
        }

        selectedCompetenceSlugs = next;
        void maybeScrollToYearsList(wasEmpty && next.size > 0);
    };

    const toggleCompetenceSelection = (slug: string) => {
        const wasEmpty = selectedCompetenceSlugs.size === 0;
        const adding = !selectedCompetenceSlugs.has(slug);
        const next = new Set(selectedCompetenceSlugs);
        if (next.has(slug)) {
            next.delete(slug);
        } else {
            next.add(slug);
        }
        selectedCompetenceSlugs = next;
        void maybeScrollToYearsList(wasEmpty && adding);
    };

    const hasActiveFilter = $derived(selectedCompetenceSlugs.size > 0);

    const isCompetenceVisible = (competence: Competence | null | undefined) => {
        if (!competence || !hasActiveFilter) return false;
        return selectedCompetenceSlugs.has(competence.slug);
    };

    const collectReferenceSlugs = (
        reference: NonNullable<Topic["individual_reference"]>[number],
    ) => {
        const slugs = new Set<string>(reference.essential_competences ?? []);
        for (const content of reference.learning_contents ?? []) {
            for (const entry of content.social_aspects ?? []) {
                const slug = getAspectSlug(entry);
                if (slug) slugs.add(slug);
            }
            for (const entry of content.language_aspects ?? []) {
                const slug = getAspectSlug(entry);
                if (slug) slugs.add(slug);
            }
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
                    class:is-active={isAspectFullySelected(group.title)}
                    style={`--aspect-color: ${getAspectColor(group.title)}`}
                    onclick={() => toggleAspectSelection(group.title)}
                >
                    {formatAspectTitle(group.title)}
                </button>
                <div class="pill-wrap">
                    {#each group.competences as competence}
                        <button
                            type="button"
                            class="pill pill-button pill-filter"
                            class:is-active={isCompetenceSelected(competence)}
                            style={`--pill-color: ${competence.color ?? "#64748b"}`}
                            onclick={() =>
                                toggleCompetenceSelection(competence.slug)}
                        >
                            <span class="pill-label">{competence.title}</span>
                            <span class="pill-count"
                                >({competenceCountBySlug.get(competence.slug) ??
                                    0})</span
                            >
                        </button>
                    {/each}
                </div>
            </article>
        {/each}
    </div>

    <div class="years" bind:this={yearsListEl}>
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
                                            <span class="topic-number"
                                                >{topic.number}.</span
                                            >
                                        {/if}
                                        <span>{getTopicTitle(topic)}</span>
                                    </h3>
                                </div>
                                <div class="row-tags">
                                    {#each topicCompetences as competence}
                                        {#if isCompetenceVisible(competence)}
                                            <button
                                                type="button"
                                                class="pill list-pill pill-button"
                                                class:is-active={isCompetenceSelected(
                                                    competence,
                                                )}
                                                style={`--pill-color: ${competence.color ?? "#64748b"}`}
                                                onclick={() =>
                                                    (selectedCompetence =
                                                        competence)}
                                            >
                                                <span class="pill-label"
                                                    >{competence.title}</span
                                                >
                                            </button>
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
                                                    class:is-active={isCompetenceSelected(
                                                        competence,
                                                    )}
                                                    style={`--pill-color: ${competence.color ?? "#64748b"}`}
                                                    onclick={() =>
                                                        (selectedCompetence =
                                                            competence)}
                                                >
                                                    <span class="pill-label"
                                                        >{competence.title}</span
                                                    >
                                                </button>
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
        gap: calc(70 * var(--u));
        margin-top: calc(120 * var(--u));
    }

    .aspect-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: calc(10 * var(--u));
        align-items: start;
    }

    .aspect-column {
        min-width: 0;
    }

    .aspect-title-button {
        margin: 0 0 calc(35 * var(--u));
        border: calc(2 * var(--u)) solid var(--color-black);
        border-radius: calc(999 * var(--u));
        padding: 0 calc(30 * var(--u));
        text-align: center;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        background: var(--aspect-color);
        color: var(--color-black);
        width: 100%;
        cursor: pointer;
        height: calc(120 * var(--u));
        /* Required for formatAspectTitle line break in Schlüsselkompetenzen */
        white-space: pre-line;
        transition: all 120ms ease;
    }

    .aspect-title-button:hover {
        /* box-shadow: 0px calc(7 * var(--u)) 0px var(--color-black); */
        /* transform: translateY(calc(-7 * var(--u))); */
        animation: shake 3s ease-in-out infinite;
    }

    .aspect-title-button.is-active {
        box-shadow: 0 calc(9 * var(--u)) calc(15 * var(--u)) rgba(0, 0, 0, 0.25);
    }

    @keyframes shake {
        0%,
        18%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        3% {
            transform: rotate(-1deg) translateX(calc(-5 * var(--u)));
        }
        6% {
            transform: rotate(1deg) translateX(calc(5 * var(--u)));
        }
        9% {
            transform: rotate(-0.75deg) translateX(calc(-5 * var(--u)));
        }
        12% {
            transform: rotate(0.75deg) translateX(calc(5 * var(--u)));
        }
        15% {
            transform: rotate(0deg) translateX(0);
        }
    }

    .pill-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        min-width: 0;
    }

    .pill-label {
        flex: 0 1 auto;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pill-count {
        flex-shrink: 0;
    }

    .pill {
        display: inline-flex;
        align-items: center;
        padding: calc(5 * var(--u)) calc(15 * var(--u));
        border-radius: calc(999 * var(--u));
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        background: var(--color-white);
        border: calc(1 * var(--u)) solid var(--color-black);
        width: fit-content;
        max-width: 100%;
        cursor: pointer;
    }

    .pill.is-active {
        background: var(--pill-color);
    }

    .pill.list-pill:hover {
        background: var(--pill-color);
    }

    .pill.pill-filter:hover:not(.is-active) {
        background: #e5e5e5;
    }

    .pill.pill-filter {
        display: inline-flex;
        width: fit-content;
        max-width: 100%;
        justify-content: space-between;
        gap: 0.35rem;
        min-width: 0;
        overflow: hidden;
        text-align: left;
    }

    .pill.is-active:hover {
        filter: brightness(1.1);
    }

    .years {
        display: flex;
        flex-direction: column;
        gap: calc(50 * var(--u));
    }

    .year-header {
        display: grid;
        grid-template-columns: 1fr minmax(14rem, 28rem);
        align-items: end;
        margin: calc(10 * var(--u)) calc(25 * var(--u));
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
        gap: calc(20 * var(--u));
    }

    .topic-card {
        background: var(--color-white);
        border-radius: calc(25 * var(--u));
        padding: calc(35 * var(--u)) calc(40 * var(--u)) calc(23 * var(--u)) calc(40 * var(--u));
    }

    .topic-card-title {
        margin: 0;
        margin-left: calc(-33 * var(--u));
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        display: flex;
        gap: 0.3em;
        align-items: baseline;
    }

    .topic-number {
        flex-shrink: 0;
    }

    .list-row {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 1.5rem;
        padding: 0.85rem 0;
        border-top: calc(5 * var(--u)) solid var(--color-background);
        margin-left: calc(35 * var(--u));
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
        left: calc(-40 * var(--u));
        top: calc(18 * var(--u));
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
        min-width: 0;
    }

    .list-pill {
        flex: 0 1 auto;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        padding: calc(5 * var(--u)) calc(15 * var(--u));
        background: var(--pill-color);
        color: var(--color-black);
    }

    .pill-button {
        cursor: pointer;
    }

    @media (max-width: 1100px) {
        .aspect-grid {
            grid-template-columns: 1fr;
            gap: calc(40 * var(--u));
        }

        .aspect-column {
            display: grid;
            grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
            gap: calc(15 * var(--u));
            align-items: start;
        }

        .aspect-title-button {
            margin: 0;
            height: calc(120 * var(--u));
            align-self: start;
        }

        .pill-wrap {
            align-content: start;
        }

        .topic-card {
            padding: 1.25rem 1rem;
        }
    }
</style>
