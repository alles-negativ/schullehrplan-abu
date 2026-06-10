<script lang="ts">
    import { onMount, tick } from "svelte";
    import type { Competence } from "$lib/data/education-modes";

    type PhysicsPill = Competence & { id: string };

    let {
        competences = [],
        dragging = $bindable(false),
    }: { competences?: PhysicsPill[]; dragging?: boolean } = $props();

    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLDivElement>();
    let spawnPillFn: ((pill: PhysicsPill) => void) | null = null;

    const trackItem = (node: HTMLDivElement, pill: PhysicsPill) => {
        itemElements.set(pill.id, node);
        requestAnimationFrame(() => {
            spawnPillFn?.(pill);
        });
        return {
            destroy() {
                itemElements.delete(pill.id);
            },
        };
    };

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
            const {
                Engine,
                World,
                Bodies,
                Body,
                Mouse,
                MouseConstraint,
                Events,
            } = Matter;
            const engine = Engine.create();
            engine.gravity.y = 0.9;
            engine.enableSleeping = true;
            const wallThickness = 320;
            const stagePadding = 2;
            let mouseConstraint: import("matter-js").MouseConstraint | null =
                null;

            const clampBodyToStage = (
                body: import("matter-js").Body,
                width: number,
                height: number,
            ) => {
                const { min, max } = body.bounds;
                let dx = 0;
                let dy = 0;

                if (min.x < stagePadding) dx = stagePadding - min.x;
                else if (max.x > width - stagePadding)
                    dx = width - stagePadding - max.x;

                if (min.y < stagePadding) dy = stagePadding - min.y;
                else if (max.y > height - stagePadding)
                    dy = height - stagePadding - max.y;

                if (dx || dy) {
                    Body.setPosition(body, {
                        x: body.position.x + dx,
                        y: body.position.y + dy,
                    });
                }
            };

            const spawnPill = (pill: PhysicsPill) => {
                if (activeSlugs.has(pill.id)) return;

                const el = itemElements.get(pill.id);
                if (!el) return;

                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                const itemWidth = el.offsetWidth;
                const itemHeight = el.offsetHeight;
                if (!itemWidth || !itemHeight) {
                    requestAnimationFrame(() => spawnPill(pill));
                    return;
                }
                const chamferRadius = Math.min(itemWidth, itemHeight) / 2;
                const halfH = itemHeight / 2;
                const halfDiag = Math.hypot(itemWidth / 2, halfH);
                const x =
                    halfDiag +
                    Math.random() * Math.max(width - halfDiag * 2, 1);
                const y = -(halfH + 40 + Math.random() * 120);
                const body = Bodies.rectangle(x, y, itemWidth, itemHeight, {
                    restitution: 0.55,
                    friction: 0.08,
                    frictionStatic: 0.12,
                    frictionAir: 0.02,
                    chamfer: { radius: chamferRadius, quality: 8 },
                    sleepThreshold: 40,
                });
                Body.setAngle(body, (Math.random() - 0.5) * Math.PI);
                Body.setVelocity(body, { x: 0, y: 0 });
                Body.setAngularVelocity(body, 0);
                worldBodies.set(pill.id, body);
                bodySizes.set(pill.id, {
                    width: itemWidth,
                    height: itemHeight,
                });
                activeSlugs.add(pill.id);
                World.add(engine.world, body);
            };

            const rebuildScene = () => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                for (const boundary of boundaries)
                    World.remove(engine.world, boundary);
                boundaries = [];

                const wallInset = wallThickness / 2;
                boundaries = [
                    Bodies.rectangle(
                        width / 2,
                        height - stagePadding + wallInset,
                        width,
                        wallThickness,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        stagePadding - wallInset,
                        height / 2,
                        wallThickness,
                        height,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        width - stagePadding + wallInset,
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
                    clampBodyToStage(body, width, height);
                }

                const mouse = Mouse.create(stage);
                stage.removeEventListener(
                    "wheel",
                    (
                        mouse as unknown as {
                            mousewheel: (event: WheelEvent) => void;
                        }
                    ).mousewheel,
                );
                if (mouseConstraint) {
                    World.remove(engine.world, mouseConstraint);
                    dragging = false;
                }
                mouseConstraint = MouseConstraint.create(engine, {
                    mouse,
                    constraint: {
                        stiffness: 0.2,
                    },
                });
                Events.on(mouseConstraint, "startdrag", () => {
                    dragging = true;
                });
                Events.on(mouseConstraint, "enddrag", () => {
                    dragging = false;
                });
                World.add(engine.world, mouseConstraint);
            };

            spawnPillFn = spawnPill;

            rebuildScene();
            tick().then(() => {
                for (const pill of competences) {
                    spawnPill(pill);
                }
            });

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
            });
            resizeObserver.observe(stage);

            return () => {
                cancelAnimationFrame(raf);
                resizeObserver?.disconnect();
                dragging = false;
                World.clear(engine.world, false);
                Engine.clear(engine);
                spawnPillFn = null;
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
        {#each competences as competence (competence.id)}
            <div
                class="pill"
                style={`--pill-color: ${competence.color ?? "#64748b"}`}
                use:trackItem={competence}
            >
                <span class="pill-title">{competence.title}</span>
            </div>
        {/each}
    </div>
</section>

<style>
    .interactive-wrap {
        position: absolute;
        inset: 0;
        z-index: 2;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        top: -85px;
        left: -30px;
    }

    .physics-stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: auto;
    }

    .pill {
        position: absolute;
        left: 0;
        top: 0;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: max-content;
        max-width: 450px;
        height: 120px;
        padding: 0 1.5rem;
        border-radius: 9999px;
        box-shadow: inset 0 0 0 2px var(--color-black);
        background: var(--pill-color);
        color: var(--color-black);
        user-select: none;
        cursor: grab;
        will-change: transform;
        pointer-events: auto;
    }

    .pill-title {
        min-width: 200px;
        max-width: 100%;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        text-align: center;
        text-wrap: balance;
        overflow-wrap: break-word;
        hyphens: auto;
    }

    .pill:active {
        cursor: grabbing;
    }
</style>
