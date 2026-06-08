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
    </div>
    <Referenze
        references={topic.individual_reference ?? []}
        inheritedEssentialCompetences={topic.essential_competences ?? []}
    />
</article>

<style>
    .content-wrap {
        margin: 0 33px;
    }

    .description {
        margin-top: 1.2rem;
    }

    .description :global(p) {
        margin: 0 0 2rem;
    }
</style>
