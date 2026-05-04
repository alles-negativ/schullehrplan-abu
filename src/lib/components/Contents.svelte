<script lang="ts">
    import { marked } from "marked";
    import {
        getCompetenceBySlug,
        type Competence,
        type LearningContent,
    } from "$lib/data/education-modes";

    let {
        content,
        inheritedEssentialCompetences = [],
    }: {
        content: LearningContent;
        inheritedEssentialCompetences?: string[];
    } = $props();

    const title = $derived(content.titel ?? content.title ?? "");
    const html = $derived(marked.parse(title) as string);
    const socialAspects = $derived(
        (content.social_aspects ?? [])
            .map((slug) => getCompetenceBySlug(slug))
            .filter((entry): entry is Competence => Boolean(entry)),
    );
    const languageAspects = $derived(
        (content.language_aspects ?? [])
            .map((slug) => getCompetenceBySlug(slug))
            .filter((entry): entry is Competence => Boolean(entry)),
    );
    const essentialCompetences = $derived(
        Array.from(
            new Set([
                ...(inheritedEssentialCompetences ?? []),
                ...(content.essential_competences ?? []),
            ]),
        )
            .map((slug) => getCompetenceBySlug(slug))
            .filter((entry): entry is Competence => Boolean(entry)),
    );

    let selectedCompetence = $state<Competence | null>(null);
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
</script>

<li class="content-item">
    {#if content.number != null}
        <span class="content-number">{content.number}. </span>
    {/if}
    <!-- Content is authored in CMS markdown -->
    <div class="content-body">
        <div class="content-text">{@html html}</div>
        <div class="content-tags">
            {#if socialAspects.length > 0}
                <div class="tag-group">
                    <span class="tag-group-label"
                        >Gesellschaftliche Aspekte:</span
                    >
                    {#each socialAspects as item}
                        <button
                            type="button"
                            class="tag"
                            style={`--tag-color: ${item.color ?? "#64748b"}`}
                            onclick={() => (selectedCompetence = item)}
                            >{item.title}</button
                        >
                    {/each}
                </div>
            {/if}
            {#if languageAspects.length > 0}
                <div class="tag-group">
                    <span class="tag-group-label">Sprachmodi:</span>
                    {#each languageAspects as item}
                        <button
                            type="button"
                            class="tag"
                            style={`--tag-color: ${item.color ?? "#64748b"}`}
                            onclick={() => (selectedCompetence = item)}
                            >{item.title}</button
                        >
                    {/each}
                </div>
            {/if}
            {#if essentialCompetences.length > 0}
                <div class="tag-group">
                    <span class="tag-group-label">Schlüsselkompetenzen:</span>
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
            {/if}
        </div>
    </div>
</li>

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
            <button
                class="modal-close"
                type="button"
                onclick={closeCompetenceModal}>Schliessen</button
            >
            <h4>{selectedCompetence.title}</h4>
            {#if selectedCompetence.aspect}
                <p class="modal-aspect">{selectedCompetence.aspect}</p>
            {/if}
            {#if selectedCompetence.description}
                <div class="modal-description">
                    {@html marked.parse(
                        selectedCompetence.description,
                    ) as string}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .content-item {
        margin: 0.25rem 0;
        display: flex;
        gap: 0.25rem;
        align-items: flex-start;
    }

    .content-number {
        font-weight: 600;
        min-width: 1.5rem;
    }

    .content-text :global(p) {
        margin: 0;
    }

    .content-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .content-tags {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        align-items: flex-start;
        justify-content: space-between;
    }

    .tag-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.4rem;
        min-width: 11rem;
        flex: 1 1 11rem;
    }

    .tag-group-label {
        font-size: 0.85rem;
        color: #475569;
    }

    .tag {
        display: block;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        font-size: 0.8rem;
        line-height: 1.4;
        background: color-mix(in srgb, var(--tag-color) 18%, white);
        border: 1px solid color-mix(in srgb, var(--tag-color) 45%, #94a3b8);
        color: #0f172a;
        width: fit-content;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        /* background: rgba(2, 6, 23, 0.45); */
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
        font-weight: 600;
    }

    .modal-description :global(p) {
        margin: 0.5rem 0;
    }
</style>
