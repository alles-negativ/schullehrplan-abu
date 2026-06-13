<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { getAllAspects, type Aspect } from "$lib/data/education-modes";
    import { isAnchorInViewportCenter, getTopicMap } from "$lib/data/topic-map";

    const config = getTopicMap();
    const aspects = getAllAspects();
    const bubbles = [...config.bubbles].sort((a, b) => a.order - b.order);

    const ORBIT_RADIUS_X = 150;
    const ORBIT_RADIUS_Y = 85;
    const QV_ORBIT_RADIUS_X = 200;
    const QV_ORBIT_RADIUS_Y = 100;
    const ORBIT_PERIOD_MS = 32000;
    const ORBIT_FADE_MS = 300;

    type PillOrbitState = {
        x: number;
        y: number;
    };

    let sectionEl = $state<HTMLElement | null>(null);
    let anchorTops = $state<Record<number, number>>({});
    let activeAnchors = $state<Record<number, boolean>>({});
    let viewportHeight = $state(0);
    let reducedMotion = $state(false);
    let isMobile = $state(false);
    let orbitAngle = $state(0);
    let hoveredTopic = $state<number | null>(null);
    let hoveredQv = $state(false);

    const computeOrbitPosition = (
        index: number,
        count: number,
        rotation: number,
        radiusX: number,
        radiusY: number,
    ): PillOrbitState => {
        const theta = (Math.PI * 2 * index) / count + rotation;
        return {
            x: Math.sin(theta) * radiusX,
            y: -Math.cos(theta) * radiusY,
        };
    };

    const computePillState = (
        index: number,
        count: number,
        rotation: number,
    ): PillOrbitState =>
        computeOrbitPosition(
            index,
            count,
            rotation,
            ORBIT_RADIUS_X,
            ORBIT_RADIUS_Y,
        );

    const pillStates = $derived.by((): PillOrbitState[] =>
        aspects.map((_, index) =>
            computePillState(index, aspects.length, orbitAngle),
        ),
    );

    const qvPillStates = $derived.by((): PillOrbitState[] =>
        config.qv.annotations.map((_, index) =>
            computeOrbitPosition(
                index,
                config.qv.annotations.length,
                orbitAngle,
                QV_ORBIT_RADIUS_X,
                QV_ORBIT_RADIUS_Y,
            ),
        ),
    );

    const showOrbit = $derived(
        hoveredTopic !== null && !isMobile && !reducedMotion,
    );

    const showQvOrbit = $derived(hoveredQv && !isMobile && !reducedMotion);

    const orbitPillStyle = (state: PillOrbitState, color?: string) =>
        [
            color ? `--pill-color: ${color}` : null,
            `--pill-x: ${state.x}px`,
            `--pill-y: ${state.y}px`,
        ]
            .filter(Boolean)
            .join("; ");

    const pillStyle = (state: PillOrbitState, aspect: Aspect) =>
        orbitPillStyle(state, aspect.color ?? "#E8E8E8");

    const aspectPillLabel = (title: string) =>
        title === "Schlüsselkompetenzen" ? "Schlüssel-Kompetenzen" : title;

    const qvAnnotationParts = (text: string) =>
        text.split(/\s*\/\s*/).filter(Boolean);

    const isBubbleActive = (anchorTopic: number) =>
        reducedMotion || isMobile || (activeAnchors[anchorTopic] ?? false);

    const bubbleStyle = (anchorTopic: number) => {
        const top = anchorTops[anchorTopic];
        return top !== undefined ? `top: ${top}px;` : "";
    };

    const updateAnchors = () => {
        if (!sectionEl) return;

        viewportHeight = window.innerHeight;

        const bubbleLayer = sectionEl.querySelector(".topicmap-bubbles");
        if (!bubbleLayer) return;

        const layerRect = bubbleLayer.getBoundingClientRect();
        const tops: Record<number, number> = {};
        const centers: Record<number, number> = {};

        for (const node of sectionEl.querySelectorAll("[data-topic-number]")) {
            const topicNumber = Number(
                (node as HTMLElement).dataset.topicNumber,
            );
            const rect = node.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            centers[topicNumber] = centerY;
            tops[topicNumber] = centerY - layerRect.top;
        }

        anchorTops = tops;

        if (reducedMotion || isMobile) return;

        const nextActive: Record<number, boolean> = {};
        for (const bubble of bubbles) {
            nextActive[bubble.anchor_topic] = isAnchorInViewportCenter(
                centers[bubble.anchor_topic],
                viewportHeight,
            );
        }
        activeAnchors = nextActive;
    };

    onMount(() => {
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        reducedMotion = motionQuery.matches;
        const mobileQuery = window.matchMedia("(max-width: 960px)");
        isMobile = mobileQuery.matches;

        const onMobileChange = (event: MediaQueryListEvent) => {
            isMobile = event.matches;
            updateAnchors();
        };
        mobileQuery.addEventListener("change", onMobileChange);

        const onScroll = () => requestAnimationFrame(updateAnchors);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        updateAnchors();

        const orbitStart = performance.now();
        let orbitFrame = 0;

        const tickOrbit = (now: number) => {
            if (
                (hoveredTopic !== null || hoveredQv) &&
                !motionQuery.matches &&
                !mobileQuery.matches
            ) {
                orbitAngle =
                    ((now - orbitStart) / ORBIT_PERIOD_MS) * Math.PI * 2;
            }
            orbitFrame = requestAnimationFrame(tickOrbit);
        };

        orbitFrame = requestAnimationFrame(tickOrbit);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            mobileQuery.removeEventListener("change", onMobileChange);
            cancelAnimationFrame(orbitFrame);
        };
    });
</script>

<section class="topicmap" bind:this={sectionEl} aria-label={config.title}>
    <h1 class="topicmap-title">{config.title}</h1>

    <div class="topicmap-stage">
        <div class="topicmap-spine">
            <div class="topicmap-spine-line" aria-hidden="true"></div>

            <ol class="topicmap-spine-list">
                {#each config.topics as topic (topic.number)}
                    <li
                        class="topicmap-node-wrap"
                        onmouseenter={() => (hoveredTopic = topic.number)}
                        onmouseleave={() => {
                            if (hoveredTopic === topic.number) {
                                hoveredTopic = null;
                            }
                        }}
                    >
                        {#if showOrbit && hoveredTopic === topic.number && aspects.length > 0}
                            <div
                                class="topicmap-orbit"
                                aria-label="Aspekte"
                                transition:fade={{
                                    duration: reducedMotion ? 0 : ORBIT_FADE_MS,
                                }}
                            >
                                {#each aspects as aspect, index (aspect.slug)}
                                    <span
                                        class="topicmap-orbit-pill"
                                        style={pillStyle(
                                            pillStates[index],
                                            aspect,
                                        )}
                                    >
                                        {aspectPillLabel(aspect.title)}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                        <div
                            class="topicmap-node"
                            data-topic-number={topic.number}
                            style={`--topic-hover-color: ${topic.hover_color};`}
                        >
                            {topic.label}
                        </div>
                    </li>
                {/each}

                <li
                    class="topicmap-node-wrap topicmap-node-wrap--qv"
                    onmouseenter={() => (hoveredQv = true)}
                    onmouseleave={() => (hoveredQv = false)}
                >
                    {#if showQvOrbit && config.qv.annotations.length > 0}
                        <div
                            class="topicmap-orbit"
                            aria-label="QV Anmerkungen"
                            transition:fade={{
                                duration: reducedMotion ? 0 : ORBIT_FADE_MS,
                            }}
                        >
                            {#each config.qv.annotations as annotation, index (annotation.text)}
                                <span
                                    class="topicmap-orbit-pill topicmap-orbit-pill--qv"
                                    style={orbitPillStyle(qvPillStates[index])}
                                >
                                    <span
                                        class="topicmap-qv-annotation-content"
                                    >
                                        {#each qvAnnotationParts(annotation.text) as part, partIndex}
                                            <span
                                                class:topicmap-qv-annotation-lead={partIndex ===
                                                    0}>{part}</span
                                            >
                                        {/each}
                                    </span>
                                </span>
                            {/each}
                        </div>
                    {:else if (isMobile || reducedMotion) && config.qv.annotations.length > 0}
                        <div class="topicmap-qv-annotations">
                            {#each config.qv.annotations as annotation}
                                <span class="topicmap-qv-annotation">
                                    <span
                                        class="topicmap-qv-annotation-content"
                                    >
                                        {#each qvAnnotationParts(annotation.text) as part, partIndex}
                                            <span
                                                class:topicmap-qv-annotation-lead={partIndex ===
                                                    0}>{part}</span
                                            >
                                        {/each}
                                    </span>
                                </span>
                            {/each}
                        </div>
                    {/if}
                    <div class="topicmap-node topicmap-node--qv">
                        {config.qv.label}
                    </div>
                </li>
            </ol>
        </div>

        <div class="topicmap-bubbles" aria-live="polite">
            {#each bubbles as bubble (bubble.order)}
                {@const active = isBubbleActive(bubble.anchor_topic)}
                <article
                    class="topicmap-bubble topicmap-bubble--{bubble.side}"
                    class:is-active={active}
                    style={bubbleStyle(bubble.anchor_topic)}
                    aria-hidden={!active}
                >
                    <h2 class="topicmap-bubble-title">{bubble.title}</h2>
                    <p>{bubble.text}</p>
                    <svg
                        class="topicmap-bubble-arrow"
                        viewBox="0 0 64 44"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <path
                            d="M63.8208 41.9756C15.6184 48.8449 4.18503 14.2542 0.644531 0.5H31.8605C29.0281 23.1938 40.7675 34.5338 63.8208 41.9756Z"
                            fill="currentColor"
                        />
                    </svg>
                </article>
            {/each}
        </div>
    </div>
</section>

<style>
    .topicmap {
        position: relative;
        padding-bottom: 4rem;
        padding-top: 150px;
    }

    .topicmap-title {
        margin-bottom: 140px;
        text-align: center;
    }

    .topicmap-stage {
        position: relative;
    }

    .topicmap-spine {
        position: relative;
        z-index: 10;
        display: flex;
        justify-content: center;
        width: 100%;
    }

    .topicmap-spine-line {
        position: absolute;
        top: 2.25rem;
        bottom: 2.25rem;
        left: 50%;
        width: 2px;
        transform: translateX(-50%);
        background: var(--color-black);
    }

    .topicmap-spine-list {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2.75rem;
        margin: 0;
        padding: 0.5rem 0;
        list-style: none;
    }

    .topicmap-node-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .topicmap-node-wrap:has(.topicmap-orbit) {
        z-index: 20;
    }

    .topicmap-node-wrap:last-child {
        margin-top: 100px;
    }

    .topicmap-node {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 300px;
        height: 140px;
        border: 2px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        text-align: center;
        font-size: var(--h1-size);
        line-height: var(--h1-line-height);
        font-weight: var(--h1-weight);
        letter-spacing: var(--h1-letter-spacing);
        transition: background-color 180ms ease;
    }

    .topicmap-node:hover {
        background: var(--topic-hover-color, var(--color-white));
    }

    .topicmap-node--qv {
        min-width: 7.5rem;
        padding-inline: 2rem;
    }

    .topicmap-orbit {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
    }

    .topicmap-orbit-pill {
        --pill-x: 0px;
        --pill-y: 0px;

        position: absolute;
        left: calc(50% + var(--pill-x));
        top: calc(50% + var(--pill-y));
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.35rem 0.85rem;
        border: 2px solid var(--color-black);
        border-radius: 9999px;
        background: var(--pill-color);
        font-size: var(--h5-size);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        line-height: 1.2;
        text-align: center;
        transform: translate(-50%, -50%);
        will-change: transform;
        height: 80px;
        width: 180px;
    }

    .topicmap-orbit-pill--qv {
        --pill-color: var(--color-white);
        align-items: center;
        justify-content: center;
        width: auto;
        min-width: 11rem;
        max-width: 14rem;
        height: auto;
        min-height: 4.5rem;
        padding: 1.25rem 2.75rem;
        font-size: var(--h6-size);
        font-weight: var(--h6-weight, 400);
        letter-spacing: var(--h6-letter-spacing, normal);
    }

    .topicmap-qv-annotation-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        line-height: 1.3;
    }

    .topicmap-qv-annotation-lead {
        font-weight: var(--h5-weight);
    }

    .topicmap-qv-annotations {
        position: absolute;
        left: calc(100% + 1rem);
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-width: 14rem;
    }

    .topicmap-qv-annotation {
        display: flex;
        align-items: center;
        padding: 10px 40px;
        border: 2px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        font-size: var(--h6-size);
        line-height: 1.3;
    }

    .topicmap-bubbles {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .topicmap-bubble {
        --bubble-color: var(--color-darkblue);

        position: absolute;
        width: 30%;
        /* max-width: 340px; */
        padding: 30px;
        border-radius: 35px;
        background: var(--bubble-color);
        color: var(--color-white);
        opacity: 0;
        transition: opacity 300ms ease;
        pointer-events: none;
    }

    .topicmap-bubble.is-active {
        opacity: 1;
        pointer-events: auto;
    }

    .topicmap-bubble--left {
        left: calc(25% - 90px);
        transform: translateY(-50%) translateX(-50%);
    }

    .topicmap-bubble--right {
        right: calc(25% - 90px);
        transform: translateY(-50%) translateX(50%);
    }

    .topicmap-bubble-arrow {
        position: absolute;
        bottom: 0;
        width: 3rem;
        height: auto;
        color: var(--bubble-color);
        pointer-events: none;
        transform: translateY(calc(100% - 1px));
    }

    .topicmap-bubble--left .topicmap-bubble-arrow {
        right: 1.5rem;
    }

    .topicmap-bubble--right .topicmap-bubble-arrow {
        left: 1.5rem;
        transform: translateY(calc(100% - 1px)) scaleX(-1);
    }

    .topicmap-bubble-title {
        margin-bottom: 22px;
    }

    .topicmap-bubble p {
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
    }

    @media (max-width: 960px) {
        .topicmap-qv-annotations {
            position: static;
            margin-top: 0.75rem;
            min-width: 0;
        }

        .topicmap-node-wrap {
            flex-direction: column;
        }

        .topicmap-bubbles {
            position: static;
            display: grid;
            gap: 1rem;
            margin-top: 2rem;
        }

        .topicmap-bubble {
            position: static;
            width: 100%;
            max-width: none;
            opacity: 1;
            transform: none;
        }

        .topicmap-bubble-arrow {
            display: none;
        }
    }
</style>
