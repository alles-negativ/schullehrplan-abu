<script lang="ts">
    import { marked } from "marked";
    import Contents from "$lib/components/Contents.svelte";
    import type { IndividualReference } from "$lib/data/education-modes";

    let {
        references,
        inheritedEssentialCompetences = [],
    }: {
        references: IndividualReference[];
        inheritedEssentialCompetences?: string[];
    } = $props();

    let collapsedByIndex = $state<Record<number, boolean>>({});

    const toggleReferenceContents = (index: number) => {
        collapsedByIndex = {
            ...collapsedByIndex,
			[index]: !(collapsedByIndex[index] ?? true),
        };
    };

	$effect(() => {
		references;
		collapsedByIndex = {};
	});
</script>

{#if references.length > 0}
    <section class="referenze">
        <h3>Individueller Lebensbezug</h3>
        {#each references as ref, index}
            <article class="reference-item">
                <div class="reference-header">
                    <div>
                        {#if ref.title || ref.titel}
                            <div class="reference-title">
                                {#if ref.number != null}
                                    <span class="reference-number"
                                        >{ref.number}.
                                    </span>
                                {/if}
                                <span
                                    >{@html marked.parse(
                                        ref.title ?? ref.titel ?? "",
                                    ) as string}</span
                                >
                            </div>
                        {/if}
                        {#if ref.lessons != null}
                            <p class="reference-lessons">
                                {ref.lessons} Lektionen
                            </p>
                        {/if}
                    </div>
                    {#if (ref.learning_contents?.length ?? 0) > 0}
                        <button
                            type="button"
                            class="reference-toggle"
                            aria-expanded={!(collapsedByIndex[index] ?? true)}
                            onclick={() => toggleReferenceContents(index)}
                        >
                            {(collapsedByIndex[index] ?? true)
                                ? "Anzeigen"
                                : "Ausblenden"}
                        </button>
                    {/if}
                </div>
                {#if (ref.learning_contents?.length ?? 0) > 0 && !(collapsedByIndex[index] ?? true)}
                    <ul class="reference-contents">
                        {#each ref.learning_contents ?? [] as content}
                            <Contents
                                {content}
                                inheritedEssentialCompetences={[
                                    ...inheritedEssentialCompetences,
                                    ...(ref.essential_competences ?? []),
                                ]}
                            />
                        {/each}
                    </ul>
                {/if}
            </article>
        {/each}
    </section>
{/if}

<style>
    .referenze {
        margin-top: 1rem;
    }

    .reference-item {
        margin-top: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.45rem;
        padding: 0.75rem;
    }

    .reference-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .reference-title :global(p) {
        margin: 0 0 0.25rem;
        font-weight: 600;
    }

    .reference-number {
        font-weight: 700;
    }

    .reference-lessons {
        margin: 0.15rem 0 0.4rem;
        font-size: 0.9rem;
        color: #4b5563;
    }

    .reference-toggle {
        border: 1px solid #94a3b8;
        border-radius: 0.45rem;
        background: #ffffff;
        color: #334155;
        font-size: 0.78rem;
        line-height: 1.2;
        padding: 0.2rem 0.5rem;
        cursor: pointer;
        white-space: nowrap;
        flex: 0 0 auto;
    }

    .reference-contents {
        margin: 0;
        padding: 0;
        list-style: none;
    }
</style>
