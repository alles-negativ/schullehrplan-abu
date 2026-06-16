<script lang="ts">
    import type { QvChapter } from "$lib/data/qv";

    let {
        chapters,
        selectedChapterIndex = -1,
        getChapterHref,
    }: {
        chapters: QvChapter[];
        selectedChapterIndex?: number;
        getChapterHref: (chapterIndex: number) => string;
    } = $props();
</script>

<aside class="side-navigation">
    <nav aria-label="QV-Kapitel">
        <ul class="topic-list">
            {#each chapters as chapter, chapterIndex}
                <li>
                    <a
                        class="topic-button"
                        class:is-active={selectedChapterIndex === chapterIndex}
                        href={getChapterHref(chapterIndex)}
                        data-sveltekit-noscroll
                        aria-current={selectedChapterIndex === chapterIndex
                            ? "page"
                            : undefined}
                    >
                        <span class="topic-label">
                            {#if chapter.number != null}
                                <span>{chapter.number}. </span>
                            {/if}
                            <span>{chapter.title}</span>
                        </span>
                    </a>
                </li>
            {/each}
        </ul>
    </nav>
</aside>

<style>
    .side-navigation {
        display: flex;
        flex-direction: column;
        gap: 50px;
        min-width: 0;
        position: relative;
    }

    .topic-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .topic-button {
        display: inline-flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 0;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        text-align: left;
        padding: 3px 15px;
        border-radius: 9999px;
        cursor: pointer;
        text-decoration: none;
        font-family: var(--font-sans);
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
        color: var(--color-black);
        border: 1.5px solid var(--color-black);
        background: var(--color-white);
        transition:
            background-color 120ms ease,
            color 120ms ease,
            border-color 120ms ease,
            filter 60ms ease;
    }

    .topic-label {
        flex: 1 1 auto;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .topic-button:hover,
    .topic-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .topic-button.is-active:hover {
        filter: brightness(1.2);
    }

    @media (prefers-reduced-motion: reduce) {
        .topic-button {
            transition: none;
        }
    }
</style>
