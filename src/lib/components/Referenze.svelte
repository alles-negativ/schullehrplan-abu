<script lang="ts">
    import { marked } from "marked";
    import { slide } from "svelte/transition";
    import arrowIcon from "$lib/assets/arrow.svg";
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
        {#each references as ref, index}
            <article
                class="reference-item"
                class:is-expanded={!(collapsedByIndex[index] ?? true)}
            >
                <div class="reference-header">
                    <div class="reference-meta">
                        {#if ref.title || ref.titel}
                            <div class="reference-title">
                                {#if ref.number != null}
                                    <span class="reference-heading"
                                        >{ref.number}. Individueller Lebensbezug
                                    </span>
                                {/if}
                                <span class="reference-summary"
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
                            class:is-expanded={!(
                                collapsedByIndex[index] ?? true
                            )}
                            aria-expanded={!(collapsedByIndex[index] ?? true)}
                            aria-label={(collapsedByIndex[index] ?? true)
                                ? "Inhalte anzeigen"
                                : "Inhalte ausblenden"}
                            onclick={() => toggleReferenceContents(index)}
                        >
                            <img
                                src={arrowIcon}
                                alt=""
                                class="reference-toggle-icon"
                            />
                        </button>
                    {:else}
                        <span class="reference-toggle reference-toggle--empty"
                            >•</span
                        >
                    {/if}
                </div>
                {#if (ref.learning_contents?.length ?? 0) > 0 && !(collapsedByIndex[index] ?? true)}
                    <ul
                        class="reference-contents"
                        transition:slide={{
                            duration: 220,
                            easing: (t) => t * (2 - t),
                        }}
                    >
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
        position: relative;
        margin-top: 0.65rem;
        border: 1px solid #3f3f46;
        border-radius: 30px; /* must remain that way*/
        padding: 1.2rem 2rem;
        background: #ffffff;
    }

    .reference-header {
        position: relative;
    }

    .reference-meta {
        min-width: 0;
        padding-right: 3.1rem;
        /* padding-bottom: 1.55rem; */
    }

    .reference-summary :global(p) {
        margin: 0.12rem 0 0;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
        color: #2d2d31;
    }

    .reference-heading {
        display: block;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
        color: #2d2d31;
    }

    .reference-lessons {
        margin: 0;
        position: absolute;
        right: -1rem;
        bottom: 0;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
        color: #3f3f46;
    }

    .reference-toggle {
        position: absolute;
        top: -0rem;
        right: -0.8rem;
        border: 0;
        border-radius: 9999px;
        width: 1.55rem;
        height: 1.55rem;
        display: inline-grid;
        place-items: center;
        background: #2f2f33;
        padding: 0;
        cursor: pointer;
        transition: background-color 120ms ease;
    }

    .reference-toggle:hover {
        background: #1f1f22;
    }

    .reference-toggle-icon {
        width: 1rem;
        height: 1rem;
        display: block;
        transform: rotate(180deg);
        transition: transform 120ms ease;
    }

    .reference-toggle.is-expanded .reference-toggle-icon {
        transform: rotate(0deg);
    }

    .reference-toggle--empty {
        visibility: hidden;
    }

    .reference-contents {
        margin: 0;
        padding: 0;
        list-style: none;
    }
</style>
