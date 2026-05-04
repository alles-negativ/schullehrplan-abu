<script lang="ts">
    import { marked } from "marked";
    import Referenze from "$lib/components/Referenze.svelte";
    import { getTopicDescription, getTopicTitle, type Topic } from "$lib/data/education-modes";

    let {
        topic,
        yearLabel,
    }: {
        topic: Topic;
        yearLabel: string;
    } = $props();
</script>

<article class="topic">
    <h2>
        {#if topic.number != null}
            {topic.number}.
        {/if}
        {getTopicTitle(topic)}
    </h2>
    {#if getTopicDescription(topic)}
        <div class="description">
            {@html (marked.parse(getTopicDescription(topic) ?? "") as string)}
        </div>
    {/if}
    <Referenze
        references={topic.individual_reference ?? []}
        inheritedEssentialCompetences={topic.essential_competences ?? []}
    />
</article>

<style>
    .topic {
        padding: 1rem;
    }

    h2 {
        margin: 0;
    }

    .description {
        margin-top: 0.75rem;
        line-height: 1.5;
    }

    .description :global(p) {
        margin: 0 0 0.75rem;
    }
</style>
