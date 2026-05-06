<script lang="ts">
    import { onMount } from "svelte";
    import {
        getAllCompetences,
        type Competence,
    } from "$lib/data/education-modes";

    const competences = getAllCompetences();
    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLButtonElement>();

    const trackItem = (node: HTMLButtonElement, slug: string) => {
        itemElements.set(slug, node);
        return {
            destroy() {
                itemElements.delete(slug);
            },
        };
    };

    onMount(() => {
        if (!containerEl) return;
        const stage = containerEl;

        let raf = 0;
        let resizeObserver: ResizeObserver | null = null;

        let worldBodies = new Map<string, import("matter-js").Body>();
        let boundaries: import("matter-js").Body[] = [];

        const setup = async () => {
            const Matter = await import("matter-js");
            const { Engine, World, Bodies, Body, Mouse, MouseConstraint } =
                Matter;
            const engine = Engine.create();
            engine.gravity.y = 0.9;

            const rebuildScene = () => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                for (const boundary of boundaries)
                    World.remove(engine.world, boundary);
                for (const body of worldBodies.values())
                    World.remove(engine.world, body);
                worldBodies = new Map();
                boundaries = [];

                const wallThickness = 80;
                boundaries = [
                    Bodies.rectangle(
                        width / 2,
                        -wallThickness / 2,
                        width,
                        wallThickness,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        width / 2,
                        height + wallThickness / 2,
                        width,
                        wallThickness,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        -wallThickness / 2,
                        height / 2,
                        wallThickness,
                        height,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        width + wallThickness / 2,
                        height / 2,
                        wallThickness,
                        height,
                        { isStatic: true },
                    ),
                ];
                World.add(engine.world, boundaries);

                for (const competence of competences) {
                    const el = itemElements.get(competence.slug);
                    if (!el) continue;
                    const itemWidth = el.offsetWidth || 120;
                    const itemHeight = el.offsetHeight || 32;
                    const x = 80 + Math.random() * Math.max(width - 160, 1);
                    const y = 20 + Math.random() * Math.max(height * 0.3, 1);
                    const body = Bodies.rectangle(x, y, itemWidth, itemHeight, {
                        restitution: 0.75,
                        friction: 0.02,
                        frictionAir: 0.01,
                    });
                    worldBodies.set(competence.slug, body);
                    World.add(engine.world, body);
                }

                const mouse = Mouse.create(stage);
                const mouseConstraint = MouseConstraint.create(engine, {
                    mouse,
                    constraint: {
                        stiffness: 0.2,
                    },
                });
                World.add(engine.world, mouseConstraint);
            };

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

            resizeObserver = new ResizeObserver(() => rebuildScene());
            resizeObserver.observe(stage);

            return () => {
                cancelAnimationFrame(raf);
                resizeObserver?.disconnect();
                World.clear(engine.world, false);
                Engine.clear(engine);
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
                style={`--pill-color: ${competence.color ?? "#64748b"}`}
                use:trackItem={competence.slug}
            >
                {competence.title}
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
        background: linear-gradient(160deg, #f8fafc, #dde5ff);
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
        align-items: center;
        border-radius: 40px;
        border: 1px solid color-mix(in srgb, var(--pill-color) 45%, #94a3b8);
        background: color-mix(in srgb, var(--pill-color) 20%, white);
        color: #0f172a;
        padding: 0.2rem 0.65rem;
        font-size: 1.8rem;
        font-weight: 300;
        line-height: 1.3;
        max-width: 20rem;
        /* white-space: nowrap; */
        user-select: none;
        cursor: grab;
        will-change: transform;
    }

    .pill:active {
        cursor: grabbing;
    }
</style>
