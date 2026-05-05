<script lang="ts">
    import { marked } from "marked";
    import Referenze from "$lib/components/Referenze.svelte";
    import {
        getTopicDescription,
        getTopicTitle,
        type Topic,
    } from "$lib/data/education-modes";

    let {
        topic,
        yearLabel,
    }: {
        topic: Topic;
        yearLabel: string;
    } = $props();
</script>

<article class="topic">
    <h2 class="topic-title">
        {#if topic.number != null}
            {topic.number}.
        {/if}
        {getTopicTitle(topic)}
    </h2>
    {#if getTopicDescription(topic)}
        <div class="description">
            {@html marked.parse(getTopicDescription(topic) ?? "") as string}
        </div>
    {/if}
    <Referenze
        references={topic.individual_reference ?? []}
        inheritedEssentialCompetences={topic.essential_competences ?? []}
    />
</article>

<style>
    .topic-title {
        margin: 0;
        font-weight: 300;
        font-size: 1.2rem;
        line-height: 0.8;
        padding: 0 2rem;
    }

    .description {
        margin-top: 1.2rem;
        max-width: 78ch;
        color: #2f2f33;
        line-height: 1.45;
        font-size: 0.9rem;
        font-weight: 300;
        padding: 0 2rem;
    }

    .description :global(p) {
        margin: 0 0 2rem;
    }

    @media (max-width: 900px) {
        .topic-title {
            font-size: 1.45rem;
        }
    }
</style>
