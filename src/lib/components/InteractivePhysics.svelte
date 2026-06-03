<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        getAllCompetences,
        type Competence,
    } from "$lib/data/education-modes";

    const competences = getAllCompetences();
    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLButtonElement>();
    let selectedSlug = $state<string | null>(null);
    let syncBodySizesFn: (() => void) | null = null;

    const trackItem = (node: HTMLButtonElement, slug: string) => {
        itemElements.set(slug, node);
        return {
            destroy() {
                itemElements.delete(slug);
            },
        };
    };

    const togglePill = async (slug: string) => {
        selectedSlug = selectedSlug === slug ? null : slug;
        await tick();
        syncBodySizesFn?.();
    };

    onMount(() => {
        if (!containerEl) return;
        const stage = containerEl;

        let raf = 0;
        let resizeObserver: ResizeObserver | null = null;

        let worldBodies = new Map<string, import("matter-js").Body>();
        let bodySizes = new Map<string, { width: number; height: number }>();
        let boundaries: import("matter-js").Body[] = [];

        const setup = async () => {
            const Matter = await import("matter-js");
            const { Engine, World, Bodies, Body, Mouse, MouseConstraint } =
                Matter;
            const engine = Engine.create();
            engine.gravity.y = 0.9;
            let mouseConstraint: import("matter-js").MouseConstraint | null =
                null;

            const syncBodySizes = () => {
                for (const competence of competences) {
                    const body = worldBodies.get(competence.slug);
                    const el = itemElements.get(competence.slug);
                    if (!body || !el) continue;

                    const targetWidth = el.offsetWidth || 120;
                    const targetHeight = el.offsetHeight || 32;
                    const knownSize = bodySizes.get(competence.slug);
                    const currentWidth = knownSize?.width ?? targetWidth;
                    const currentHeight = knownSize?.height ?? targetHeight;
                    if (!currentWidth || !currentHeight) continue;

                    const scaleX = targetWidth / currentWidth;
                    const scaleY = targetHeight / currentHeight;
                    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY))
                        continue;
                    if (
                        Math.abs(scaleX - 1) < 0.01 &&
                        Math.abs(scaleY - 1) < 0.01
                    )
                        continue;

                    Body.scale(body, scaleX, scaleY);
                    bodySizes.set(competence.slug, {
                        width: targetWidth,
                        height: targetHeight,
                    });
                }
            };

            const rebuildScene = () => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                for (const boundary of boundaries)
                    World.remove(engine.world, boundary);
                boundaries = [];

                // Extra-thick boundaries reduce tunneling when pills get large.
                const wallThickness = 320;
                const wallInset = wallThickness / 2;
                boundaries = [
                    Bodies.rectangle(
                        width / 2,
                        -wallInset,
                        width,
                        wallThickness,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        width / 2,
                        height + wallInset,
                        width,
                        wallThickness,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        -wallInset,
                        height / 2,
                        wallThickness,
                        height,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        width + wallInset,
                        height / 2,
                        wallThickness,
                        height,
                        { isStatic: true },
                    ),
                ];
                World.add(engine.world, boundaries);

                if (worldBodies.size === 0) {
                    for (const competence of competences) {
                        const el = itemElements.get(competence.slug);
                        if (!el) continue;
                        const itemWidth = el.offsetWidth || 120;
                        const itemHeight = el.offsetHeight || 32;
                        const x = 80 + Math.random() * Math.max(width - 160, 1);
                        const y =
                            20 + Math.random() * Math.max(height * 0.3, 1);
                        const body = Bodies.rectangle(
                            x,
                            y,
                            itemWidth,
                            itemHeight,
                            {
                                restitution: 0.75,
                                friction: 0.02,
                                frictionAir: 0.01,
                            },
                        );
                        worldBodies.set(competence.slug, body);
                        bodySizes.set(competence.slug, {
                            width: itemWidth,
                            height: itemHeight,
                        });
                        World.add(engine.world, body);
                    }
                } else {
                    // Keep bodies stable across resize and just ensure they stay inside walls.
                    for (const competence of competences) {
                        const body = worldBodies.get(competence.slug);
                        if (!body) continue;
                        const size = bodySizes.get(competence.slug);
                        const halfW = (size?.width ?? 120) / 2;
                        const halfH = (size?.height ?? 32) / 2;
                        const clampedX = Math.max(
                            halfW,
                            Math.min(width - halfW, body.position.x),
                        );
                        const clampedY = Math.max(
                            halfH,
                            Math.min(height - halfH, body.position.y),
                        );
                        Body.setPosition(body, { x: clampedX, y: clampedY });
                    }
                }

                const mouse = Mouse.create(stage);
                if (mouseConstraint) {
                    World.remove(engine.world, mouseConstraint);
                }
                mouseConstraint = MouseConstraint.create(engine, {
                    mouse,
                    constraint: {
                        stiffness: 0.2,
                    },
                });
                World.add(engine.world, mouseConstraint);
            };
            syncBodySizesFn = syncBodySizes;

            rebuildScene();

            const frame = () => {
                Engine.update(engine, 1000 / 60);
                for (const competence of competences) {
                    const body = worldBodies.get(competence.slug);
                    const el = itemElements.get(competence.slug);
                    if (!body || !el) continue;
                    const x = body.position.x - (el.offsetWidth || 120) / 2;
                    const y = body.position.y - (el.offsetHeight || 32) / 2;
                    el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                }
                raf = requestAnimationFrame(frame);
            };

            frame();

            resizeObserver = new ResizeObserver(() => {
                rebuildScene();
                requestAnimationFrame(() => syncBodySizes());
            });
            resizeObserver.observe(stage);

            return () => {
                cancelAnimationFrame(raf);
                resizeObserver?.disconnect();
                World.clear(engine.world, false);
                Engine.clear(engine);
                syncBodySizesFn = null;
            };
        };

        let teardown: (() => void) | void;
        setup().then((cleanup) => {
            teardown = cleanup;
        });

        return () => {
            teardown?.();
        };
    });
</script>

<section class="interactive-wrap">
    <div class="physics-stage" bind:this={containerEl}>
        {#each competences as competence (competence.slug)}
            <button
                type="button"
                class="pill"
                class:selected={selectedSlug === competence.slug}
                style={`--pill-color: ${competence.color ?? "#64748b"}`}
                use:trackItem={competence.slug}
                aria-expanded={selectedSlug === competence.slug}
                onclick={() => togglePill(competence.slug)}
            >
                <span class="pill-title">{competence.title}</span>
                {#if selectedSlug === competence.slug}
                    {#if competence.description}
                        <span class="pill-description"
                            >{competence.description}</span
                        >
                    {:else}
                        <span class="pill-description">
                            Keine weitere Beschreibung vorhanden.
                        </span>
                    {/if}
                {/if}
            </button>
        {/each}
    </div>
</section>

<style>
    .interactive-wrap {
        position: fixed;
        inset: 0;
        z-index: -1;
        width: 100vw;
        height: 100vh;
        padding: 0;
        /* background: linear-gradient(160deg, #f8fafc, #dde5ff); */
    }

    .physics-stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border: 0;
        border-radius: 0;
    }

    .pill {
        position: absolute;
        left: 0;
        top: 0;
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
        border-radius: 40px;
        border: 1px solid color-mix(in srgb, var(--pill-color) 45%, #94a3b8);
        background: color-mix(in srgb, var(--pill-color) 20%, white);
        color: #0f172a;
        padding: 0.35rem 0.8rem;
        font-size: 1.25rem;
        font-weight: 300;
        line-height: 1.3;
        max-width: min(40rem, 85vw);
        user-select: none;
        cursor: grab;
        will-change: transform;
        transition:
            max-width 180ms ease,
            padding 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
    }

    .pill-title {
        font-size: 1.35em;
        line-height: 1.2;
        text-wrap: balance;
    }

    .pill-description {
        font-size: 0.7em;
        line-height: 1.35;
        font-weight: 400;
        opacity: 0.9;
    }

    .pill.selected {
        padding: 0.8rem 1rem;
        max-width: min(48rem, 90vw);
        box-shadow: 0 12px 30px
            color-mix(in srgb, var(--pill-color) 20%, #0f172a 8%);
        background: color-mix(in srgb, var(--pill-color) 35%, white);
    }

    .pill:active {
        cursor: grabbing;
    }
</style>
