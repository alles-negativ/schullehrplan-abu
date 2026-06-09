<script lang="ts">
    import { onMount, tick } from "svelte";
    import type { Competence } from "$lib/data/education-modes";

    let { competences = [] }: { competences?: Competence[] } = $props();

    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLButtonElement>();
    let selectedSlug = $state<string | null>(null);
    let syncBodySizesFn: (() => void) | null = null;
    let spawnCompetencesFn: ((list: Competence[]) => void) | null = null;
    let latestCompetences: Competence[] = [];

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

    $effect(() => {
        latestCompetences = competences;
        tick().then(() => {
            spawnCompetencesFn?.(latestCompetences);
        });
    });

    onMount(() => {
        if (!containerEl) return;
        const stage = containerEl;

        let raf = 0;
        let resizeObserver: ResizeObserver | null = null;

        let worldBodies = new Map<string, import("matter-js").Body>();
        let bodySizes = new Map<string, { width: number; height: number }>();
        let boundaries: import("matter-js").Body[] = [];
        let activeSlugs = new Set<string>();

        const setup = async () => {
            const Matter = await import("matter-js");
            const { Engine, World, Bodies, Body, Mouse, MouseConstraint } =
                Matter;
            const engine = Engine.create();
            engine.gravity.y = 0.9;
            let mouseConstraint: import("matter-js").MouseConstraint | null =
                null;

            const syncBodySizes = () => {
                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    const el = itemElements.get(slug);
                    if (!body || !el) continue;

                    const targetWidth = el.offsetWidth || 120;
                    const targetHeight = el.offsetHeight || 32;
                    const knownSize = bodySizes.get(slug);
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
                    bodySizes.set(slug, {
                        width: targetWidth,
                        height: targetHeight,
                    });
                }
            };

            const clearBodies = () => {
                for (const body of worldBodies.values()) {
                    World.remove(engine.world, body);
                }
                worldBodies.clear();
                bodySizes.clear();
                activeSlugs.clear();
            };

            const spawnBodies = (list: Competence[]) => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                clearBodies();

                for (const competence of list) {
                    const el = itemElements.get(competence.slug);
                    if (!el) continue;

                    const itemWidth = el.offsetWidth || 120;
                    const itemHeight = el.offsetHeight || 32;
                    const x = 80 + Math.random() * Math.max(width - 160, 1);
                    const y = -(40 + Math.random() * 120);
                    const body = Bodies.rectangle(x, y, itemWidth, itemHeight, {
                        restitution: 0.75,
                        friction: 0.02,
                        frictionAir: 0.01,
                    });
                    worldBodies.set(competence.slug, body);
                    bodySizes.set(competence.slug, {
                        width: itemWidth,
                        height: itemHeight,
                    });
                    activeSlugs.add(competence.slug);
                    World.add(engine.world, body);
                }
            };

            const rebuildScene = () => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                for (const boundary of boundaries)
                    World.remove(engine.world, boundary);
                boundaries = [];

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

                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    if (!body) continue;
                    const size = bodySizes.get(slug);
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
            spawnCompetencesFn = spawnBodies;

            rebuildScene();
            tick().then(() => spawnBodies(latestCompetences));

            const frame = () => {
                Engine.update(engine, 1000 / 60);
                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    const el = itemElements.get(slug);
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
                spawnCompetencesFn = null;
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
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .physics-stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .pill {
        position: absolute;
        left: 0;
        top: 0;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.2rem;
        border-radius: 9999px;
        border: 1.5px solid var(--color-black);
        background: var(--pill-color);
        color: var(--color-black);
        padding: 0px 40px;
        max-width: 400px;
        min-width: 200px;
        user-select: none;
        cursor: grab;
        will-change: transform;
        pointer-events: auto;
        transition:
            max-width 180ms ease,
            padding 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        height: 120px;
        width: fit-content;
    }

    .pill-title {
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        text-wrap: balance;
    }

    .pill-description {
        font-size: var(--body-size);
        line-height: var(--body-line-height);
        font-weight: var(--body-weight);
        letter-spacing: var(--body-letter-spacing);
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
