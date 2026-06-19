<script lang="ts">
    import { marked } from "marked";
    import { slide } from "svelte/transition";
    import arrowIcon from "$lib/assets/arrow.svg";
    import Contents from "$lib/components/Contents.svelte";
    import type { IndividualReference } from "$lib/data/education-modes";

    let {
        references,
        topicNumber,
    }: {
        references: IndividualReference[];
        topicNumber?: number;
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
        <h4 class="section-label">Lebensbezüge und Kompetenzen</h4>
        {#each references as ref, index}
            <div
                class="reference-item"
                class:is-expanded={!(collapsedByIndex[index] ?? true)}
            >
                <div
                    class="reference-header"
                    role="button"
                    tabindex="0"
                    onclick={() => toggleReferenceContents(index)}
                    onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                            toggleReferenceContents(index);
                    }}
                    aria-expanded={!(collapsedByIndex[index] ?? true)}
                    aria-label={(collapsedByIndex[index] ?? true)
                        ? "Inhalte anzeigen"
                        : "Inhalte ausblenden"}
                >
                    <div class="reference-meta">
                        {#if ref.title || ref.titel}
                            <div class="reference-title">
                                {#if ref.number != null}
                                    <span class="reference-heading"
                                        >{topicNumber}.{ref.number}
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
                                {topicNumber}
                                referenceNumber={ref.number}
                            />
                        {/each}
                    </ul>
                {/if}
            </div>
        {/each}
    </section>
{/if}

<style>
    .referenze {
        margin-top: calc(80 * var(--u));
    }

    .reference-item {
        position: relative;
        margin-top: 0.65rem;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: calc(30 * var(--u)); /* must remain that way*/
        padding: calc(23 * var(--u)) calc(21 * var(--u)) calc(30 * var(--u)) calc(33 * var(--u));
        background: var(--color-white);
    }

    .reference-header {
        position: relative;
        cursor: pointer;
    }

    .reference-meta {
        min-width: 0;
        padding-right: 3.1rem;
        /* padding-bottom: 1.55rem; */
    }

    .reference-summary :global(p) {
        margin: calc(5 * var(--u)) 0 0;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        color: var(--color-black);
    }

    .reference-heading {
        display: block;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        color: var(--color-black);
    }

    .reference-lessons {
        margin: 0;
        position: absolute;
        right: 0px;
        bottom: calc(-13 * var(--u));
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
        color: var(--color-black);
    }

    .reference-toggle {
        position: absolute;
        top: calc(-2 * var(--u));
        right: 0px;
        border: 0;
        border-radius: 9999px;
        width: calc(52 * var(--u));
        height: calc(52 * var(--u));
        display: inline-grid;
        place-items: center;
        background: var(--color-darkblue);
        border: calc(1.5 * var(--u)) solid var(--color-black);
        padding: 0;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            filter 60ms ease;
    }

    .reference-toggle:hover {
        filter: brightness(1.2);
    }

    .reference-toggle-icon {
        /* width: calc(40 * var(--u)); */
        height: calc(30 * var(--u));
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

    .section-label {
        margin-left: calc(33 * var(--u));
    }
</style>
