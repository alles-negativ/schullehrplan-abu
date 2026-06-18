<script lang="ts">
    import { onMount, tick } from "svelte";
    import type { Competence } from "$lib/data/education-modes";
    import {
        createMatterTimestepState,
        stepMatterPhysics,
    } from "$lib/matter-timestep";

    type PhysicsPill = Competence & { id: string };

    let {
        competences = [],
        dragging = $bindable(false),
    }: { competences?: PhysicsPill[]; dragging?: boolean } = $props();

    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLDivElement>();
    let spawnPillFn: ((pill: PhysicsPill) => void) | null = null;
    let pillSizes = $state<Record<string, { pill: number; inner: number }>>({});
    let spawnedPills = $state<Record<string, boolean>>({});

    const PILL_MAX_WIDTH = 550;
    const PILL_H_PADDING = 76;
    const PILL_MIN_CONTENT = 200;

    let measurer: HTMLDivElement | null = null;

    const getMeasurer = (title: HTMLElement) => {
        if (!measurer) {
            measurer = document.createElement("div");
            measurer.style.cssText =
                "position:absolute;top:-99999px;left:-99999px;visibility:hidden;pointer-events:none;padding:0;margin:0;border:0;display:inline-block;";
            document.body.appendChild(measurer);
        }

        const cs = getComputedStyle(title);
        const m = measurer.style;
        m.fontFamily = cs.fontFamily;
        m.fontSize = cs.fontSize;
        m.fontWeight = cs.fontWeight;
        m.fontStyle = cs.fontStyle;
        m.letterSpacing = cs.letterSpacing;
        m.lineHeight = cs.lineHeight;
        m.textTransform = cs.textTransform;
        m.overflowWrap = "normal";
        m.wordBreak = "normal";
        m.hyphens = "none";
        (m as unknown as { webkitHyphens: string }).webkitHyphens = "none";
        m.textAlign = cs.textAlign;
        m.boxSizing = "content-box";
        measurer.textContent = title.textContent;
        return measurer;
    };

    // Sizes the pill to its content: grows on a single line until it would
    // exceed maxContent, then shrinks to the narrowest width that keeps the
    // same line count without breaking words mid-character.
    const fitPillWidth = (pill: HTMLDivElement, id: string) => {
        const title = pill.querySelector<HTMLElement>(".pill-title");
        if (!title) return;

        const m = getMeasurer(title);
        const maxContent = PILL_MAX_WIDTH - PILL_H_PADDING;
        const lineHeight =
            parseFloat(getComputedStyle(m).lineHeight) ||
            parseFloat(getComputedStyle(m).fontSize) * 1.2 ||
            1;

        const hasMidWordBreak = () => {
            const text = m.textContent ?? "";
            const textNode = m.firstChild;
            if (
                !textNode ||
                textNode.nodeType !== Node.TEXT_NODE ||
                !text.length
            ) {
                return false;
            }

            const range = document.createRange();
            let lastTop: number | null = null;

            for (let i = 0; i < text.length; i++) {
                range.setStart(textNode, i);
                range.setEnd(textNode, i + 1);
                const rect = range.getClientRects()[0];
                if (!rect) continue;

                if (lastTop !== null && Math.abs(rect.top - lastTop) > 1) {
                    const before = text[i - 1];
                    const after = text[i];
                    if (before !== " " && after !== " ") return true;
                }
                lastTop = rect.top;
            }

            return false;
        };

        const measureAt = (width: number) => {
            m.style.whiteSpace = "normal";
            m.style.width = `${width}px`;
            const lines = Math.max(1, Math.round(m.scrollHeight / lineHeight));
            const overflows = m.scrollWidth > width + 1;
            return {
                lines,
                overflows,
                midWordBreak: hasMidWordBreak(),
            };
        };

        const fits = (width: number, maxLines: number) => {
            const { lines, overflows, midWordBreak } = measureAt(width);
            return lines <= maxLines && !overflows && !midWordBreak;
        };

        m.style.whiteSpace = "nowrap";
        m.style.width = "auto";
        const oneLine = Math.ceil(m.getBoundingClientRect().width);
        m.style.whiteSpace = "normal";

        let contentWidth: number;

        if (oneLine <= maxContent) {
            contentWidth = Math.max(oneLine, PILL_MIN_CONTENT);
        } else {
            const targetLines = Math.min(2, measureAt(maxContent).lines);

            let lo = PILL_MIN_CONTENT;
            let hi = maxContent;
            let best = maxContent;

            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (fits(mid, targetLines)) {
                    best = mid;
                    hi = mid - 1;
                } else {
                    lo = mid + 1;
                }
            }

            contentWidth = best;
        }

        const size = {
            pill: Math.round(contentWidth + PILL_H_PADDING),
            inner: Math.round(contentWidth),
        };
        pillSizes = { ...pillSizes, [id]: size };
        return size;
    };

    const trackItem = (node: HTMLDivElement, pill: PhysicsPill) => {
        itemElements.set(pill.id, node);

        const spawnWhenReady = async () => {
            if (document.fonts?.ready) {
                await document.fonts.ready;
            }

            const trySpawn = () => {
                if (spawnPillFn) {
                    spawnPillFn(pill);
                } else {
                    requestAnimationFrame(trySpawn);
                }
            };

            requestAnimationFrame(() => requestAnimationFrame(trySpawn));
        };

        void spawnWhenReady();

        return {
            destroy() {
                itemElements.delete(pill.id);
                const { [pill.id]: _size, ...restSizes } = pillSizes;
                pillSizes = restSizes;
                const { [pill.id]: _spawned, ...restSpawned } = spawnedPills;
                spawnedPills = restSpawned;
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
                Sleeping,
            } = Matter;
            const engine = Engine.create();
            engine.gravity.y = 2.5;
            engine.enableSleeping = true;
            const wallThickness = 320;
            const stagePadding = 2;
            const sideWallTopExtension = 400;
            let mouseConstraint: import("matter-js").MouseConstraint | null =
                null;

            const syncElementToBody = (
                el: HTMLDivElement,
                body: import("matter-js").Body,
            ) => {
                const w = el.offsetWidth || 120;
                const h = el.offsetHeight || 32;
                const x = body.position.x - w / 2;
                const y = body.position.y - h / 2;
                el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
            };

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

                const measured = fitPillWidth(el, pill.id);
                if (!measured) return;

                void tick().then(() => {
                    requestAnimationFrame(() => {
                        if (activeSlugs.has(pill.id)) return;

                        const width = containerEl?.clientWidth ?? 0;
                        const height = containerEl?.clientHeight ?? 0;
                        if (!width || !height) return;

                        const itemWidth = el.offsetWidth || measured.pill;
                        const itemHeight = el.offsetHeight;
                        if (!itemWidth || !itemHeight) {
                            requestAnimationFrame(() => spawnPill(pill));
                            return;
                        }
                        const chamferRadius =
                            Math.min(itemWidth, itemHeight) / 2;
                        const halfH = itemHeight / 2;
                        const halfDiag = Math.hypot(itemWidth / 2, halfH);
                        const x =
                            halfDiag +
                            Math.random() * Math.max(width - halfDiag * 2, 1);
                        const y = -(halfH + 80 + Math.random() * 200);
                        const body = Bodies.rectangle(
                            x,
                            y,
                            itemWidth,
                            itemHeight,
                            {
                                restitution: 0.55,
                                friction: 0.08,
                                frictionStatic: 0.12,
                                frictionAir: 0.02,
                                chamfer: { radius: chamferRadius, quality: 8 },
                                sleepThreshold: 40,
                            },
                        );
                        Body.setAngle(body, (Math.random() - 0.5) * Math.PI);
                        Body.setVelocity(body, { x: 0, y: 0 });
                        Body.setAngularVelocity(body, 0);
                        syncElementToBody(el, body);
                        worldBodies.set(pill.id, body);
                        bodySizes.set(pill.id, {
                            width: itemWidth,
                            height: itemHeight,
                        });
                        activeSlugs.add(pill.id);
                        World.add(engine.world, body);
                        spawnedPills = { ...spawnedPills, [pill.id]: true };
                    });
                });
            };

            let stageWidth = 0;
            let stageHeight = 0;

            const updateBoundaries = () => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;
                if (!width || !height) return;

                const scaleX = stageWidth ? width / stageWidth : 1;
                const scaleY = stageHeight ? height / stageHeight : 1;

                for (const boundary of boundaries)
                    World.remove(engine.world, boundary);
                boundaries = [];

                const wallInset = wallThickness / 2;
                const sideWallHeight = height + sideWallTopExtension;
                const sideWallCenterY = (height - sideWallTopExtension) / 2;
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
                        sideWallCenterY,
                        wallThickness,
                        sideWallHeight,
                        { isStatic: true },
                    ),
                    Bodies.rectangle(
                        width - stagePadding + wallInset,
                        sideWallCenterY,
                        wallThickness,
                        sideWallHeight,
                        { isStatic: true },
                    ),
                ];
                World.add(engine.world, boundaries);

                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    if (!body) continue;

                    if (stageWidth && stageHeight) {
                        const widthChanged =
                            Math.abs(width - stageWidth) >
                            Math.max(8, stageWidth * 0.02);
                        const heightChanged =
                            Math.abs(height - stageHeight) >
                            Math.max(8, stageHeight * 0.02);

                        if (widthChanged || heightChanged) {
                            Body.setPosition(body, {
                                x: body.position.x * scaleX,
                                y: body.position.y * scaleY,
                            });
                            Body.setVelocity(body, {
                                x: body.velocity.x * scaleX,
                                y: body.velocity.y * scaleY,
                            });
                            Sleeping.set(body, false);
                        }
                    }

                    clampBodyToStage(body, width, height);
                }

                stageWidth = width;
                stageHeight = height;
            };

            const setupMouse = () => {
                const mouse = Mouse.create(stage);
                stage.removeEventListener(
                    "wheel",
                    (
                        mouse as unknown as {
                            mousewheel: (event: WheelEvent) => void;
                        }
                    ).mousewheel,
                );
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

            updateBoundaries();
            setupMouse();

            const timestep = createMatterTimestepState();

            const frame = (time: number) => {
                stepMatterPhysics(
                    (delta) => Engine.update(engine, delta),
                    time,
                    timestep,
                );
                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    const el = itemElements.get(slug);
                    if (!body || !el) continue;
                    syncElementToBody(el, body);
                }
                raf = requestAnimationFrame(frame);
            };

            raf = requestAnimationFrame(frame);

            let resizeRaf = 0;
            let resizeObserverActive = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resizeObserverActive = true;
                });
            });
            resizeObserver = new ResizeObserver(() => {
                if (!resizeObserverActive || resizeRaf) return;
                resizeRaf = requestAnimationFrame(() => {
                    resizeRaf = 0;
                    updateBoundaries();
                });
            });
            resizeObserver.observe(stage);

            return () => {
                cancelAnimationFrame(raf);
                if (resizeRaf) cancelAnimationFrame(resizeRaf);
                resizeObserver?.disconnect();
                dragging = false;
                World.clear(engine.world, false);
                Engine.clear(engine);
                spawnPillFn = null;
                measurer?.remove();
                measurer = null;
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
            {@const size = pillSizes[competence.id]}
            <div
                class="pill"
                class:is-sized={size}
                class:is-spawned={spawnedPills[competence.id]}
                style={`--pill-color: ${competence.color ?? "#64748b"};${size ? `--pill-w: ${size.pill}px; --pill-inner-w: ${size.inner}px;` : ""}`}
                use:trackItem={competence}
            >
                <div class="pill-inner">
                    <span class="pill-title" lang="de">{competence.title}</span>
                </div>
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
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--pill-w, auto);
        min-width: 0;
        max-width: 550px;
        min-height: 120px;
        padding: 0px 38px;
        border-radius: 9999px;
        box-shadow: inset 0 0 0 2px var(--color-black);
        background: var(--pill-color);
        color: var(--color-black);
        user-select: none;
        cursor: grab;
        will-change: transform;
        pointer-events: auto;
        visibility: hidden;
    }

    .pill.is-sized.is-spawned {
        visibility: visible;
    }

    .pill-inner {
        flex: 0 0 auto;
        width: var(--pill-inner-w, auto);
        min-width: 0;
        max-width: calc(550px - 76px);
    }

    .pill-title {
        display: block;
        min-width: 0;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        text-align: center;
        overflow-wrap: normal;
        word-break: normal;
        hyphens: none;
    }

    .pill:active {
        cursor: grabbing;
    }
</style>
