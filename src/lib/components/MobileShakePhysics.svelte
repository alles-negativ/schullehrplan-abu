<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        assessMotionSensorReadiness,
        motionSensorsSupported,
        needsMotionPermission,
        requestMotionSensorsAccess,
        verifyMotionSensorsDeliverData,
    } from "$lib/device-motion";
    import type { Competence } from "$lib/data/education-modes";
    import {
        createMobileMotionStatus,
        type MobileMotionControls,
        type MobileMotionStatus,
    } from "$lib/mobile-motion-status";
    import {
        createMatterTimestepState,
        stepMatterPhysics,
    } from "$lib/matter-timestep";

    type PhysicsPill = Competence & { id: string };

    let {
        competences = [],
        motionStatus = $bindable(createMobileMotionStatus()),
        motionControls = $bindable<MobileMotionControls | null>(null),
    }: {
        competences?: PhysicsPill[];
        motionStatus?: MobileMotionStatus;
        motionControls?: MobileMotionControls | null;
    } = $props();

    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLDivElement>();
    let spawnPillFn: ((pill: PhysicsPill) => void) | null = null;
    let removePillFn: ((pillId: string) => void) | null = null;
    let pillSizes = $state<Record<string, { pill: number; inner: number }>>({});
    let motionEnabled = $state(false);
    let needsPermission = $state(false);
    let permissionPending = $state(false);
    let motionAssessmentComplete = $state(false);
    let sensorsReady = $state(false);
    let sensorsUnavailable = $state(false);
    let permissionDenied = $state(false);

    let sensorHandlers: {
        onOrientation: ((event: DeviceOrientationEvent) => void) | null;
        onMotion: ((event: DeviceMotionEvent) => void) | null;
    } = {
        onOrientation: null,
        onMotion: null,
    };
    let sensorsAttached = false;

    const PILL_MAX_WIDTH = 300;
    const PILL_H_PADDING = 48;
    const PILL_MIN_CONTENT = 120;

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
                removePillFn?.(pill.id);
                itemElements.delete(pill.id);
                const { [pill.id]: _, ...rest } = pillSizes;
                pillSizes = rest;
            },
        };
    };

    const activateMotionSensors = async (): Promise<boolean> => {
        if (!needsMotionPermission()) {
            motionEnabled = true;
            return true;
        }

        const delivers = await verifyMotionSensorsDeliverData();
        if (!delivers) {
            sensorsUnavailable = true;
            motionEnabled = false;
            return false;
        }

        motionEnabled = true;
        return true;
    };

    const enableMotion = async () => {
        permissionPending = true;
        permissionDenied = false;

        try {
            const access = await requestMotionSensorsAccess();
            if (access === "denied") {
                permissionDenied = true;
                needsPermission = false;
                return;
            }
            if (access !== "granted") {
                sensorsUnavailable = true;
                needsPermission = false;
                return;
            }

            const activated = await activateMotionSensors();
            if (activated) needsPermission = false;
        } finally {
            permissionPending = false;
        }
    };

    $effect(() => {
        motionStatus = {
            assessmentComplete: motionAssessmentComplete,
            needsPermission,
            motionEnabled,
            permissionPending,
            permissionDenied,
            sensorsUnavailable,
        };
    });

    $effect(() => {
        motionControls = { enableMotion };
    });

    const attachSensors = () => {
        if (
            sensorsAttached ||
            !motionEnabled ||
            !sensorsReady ||
            !motionSensorsSupported()
        ) {
            return;
        }
        if (sensorHandlers.onOrientation) {
            window.addEventListener(
                "deviceorientation",
                sensorHandlers.onOrientation,
            );
        }
        if (sensorHandlers.onMotion) {
            window.addEventListener("devicemotion", sensorHandlers.onMotion);
        }
        sensorsAttached = true;
    };

    const detachSensors = () => {
        if (!sensorsAttached) return;
        if (sensorHandlers.onOrientation) {
            window.removeEventListener(
                "deviceorientation",
                sensorHandlers.onOrientation,
            );
        }
        if (sensorHandlers.onMotion) {
            window.removeEventListener("devicemotion", sensorHandlers.onMotion);
        }
        sensorsAttached = false;
    };

    $effect(() => {
        if (motionEnabled && sensorsReady) {
            attachSensors();
        } else {
            detachSensors();
        }

        return () => {
            detachSensors();
        };
    });

    onMount(() => {
        void assessMotionSensorReadiness().then(async (readiness) => {
            switch (readiness.status) {
                case "unavailable":
                    sensorsUnavailable = true;
                    break;
                case "denied":
                    permissionDenied = true;
                    break;
                case "prompt":
                    needsPermission = true;
                    break;
                case "ready":
                    await activateMotionSensors();
                    break;
            }
            motionAssessmentComplete = true;
        });

        if (!containerEl) return;
        const stage = containerEl;

        let raf = 0;
        let resizeObserver: ResizeObserver | null = null;

        let worldBodies = new Map<string, import("matter-js").Body>();
        let bodySizes = new Map<string, { width: number; height: number }>();
        let boundaries: import("matter-js").Body[] = [];
        let activeSlugs = new Set<string>();
        let engineRef: import("matter-js").Engine | null = null;
        let BodyRef: typeof import("matter-js").Body | null = null;
        let mouseConstraint: import("matter-js").MouseConstraint | null = null;

        const setup = async () => {
            const Matter = await import("matter-js");
            const {
                Engine,
                World,
                Bodies,
                Body,
                Mouse,
                MouseConstraint,
                Sleeping,
            } = Matter;
            const engine = Engine.create();
            engineRef = engine;
            BodyRef = Body;
            engine.gravity.y = 1;
            engine.enableSleeping = true;
            const wallThickness = 200;
            const stagePadding = 2;

            const randomInStagePosition = (
                width: number,
                height: number,
                itemWidth: number,
                itemHeight: number,
            ) => {
                const halfDiag = Math.hypot(itemWidth / 2, itemHeight / 2);
                const minX = stagePadding + halfDiag;
                const maxX = width - stagePadding - halfDiag;
                const minY = stagePadding + halfDiag;
                const maxY = height - stagePadding - halfDiag;

                return {
                    x:
                        maxX > minX
                            ? minX + Math.random() * (maxX - minX)
                            : width / 2,
                    y:
                        maxY > minY
                            ? minY + Math.random() * (maxY - minY)
                            : height / 2,
                };
            };

            const wakeAllPills = () => {
                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    if (body) Sleeping.set(body, false);
                }
            };

            const removePill = (pillId: string) => {
                const body = worldBodies.get(pillId);
                if (!body) return;

                if (mouseConstraint?.body === body) {
                    (
                        mouseConstraint as {
                            body: import("matter-js").Body | null;
                        }
                    ).body = null;
                }

                World.remove(engine.world, body);
                worldBodies.delete(pillId);
                bodySizes.delete(pillId);
                activeSlugs.delete(pillId);
                wakeAllPills();
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
                    const chamferRadius = Math.min(itemWidth, itemHeight) / 2;
                    const { x, y } = randomInStagePosition(
                        width,
                        height,
                        itemWidth,
                        itemHeight,
                    );
                    const body = Bodies.rectangle(x, y, itemWidth, itemHeight, {
                        restitution: 0.62,
                        friction: 0.06,
                        frictionStatic: 0.1,
                        frictionAir: 0.015,
                        chamfer: { radius: chamferRadius, quality: 8 },
                        sleepThreshold: 30,
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
                    wakeAllPills();
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
                boundaries = [
                    Bodies.rectangle(
                        width / 2,
                        stagePadding - wallInset,
                        width,
                        wallThickness,
                        { isStatic: true },
                    ),
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

                    if (stageWidth && stageHeight) {
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
                World.add(engine.world, mouseConstraint);
            };

            spawnPillFn = spawnPill;
            removePillFn = removePill;
            updateBoundaries();
            setupMouse();

            let lastAccel = { x: 0, y: 0, z: 0 };
            let lastShakeAt = 0;
            let smoothedGamma = 0;
            let smoothedBeta = 0;

            sensorHandlers.onOrientation = (event: DeviceOrientationEvent) => {
                if (!motionEnabled || !engineRef) return;

                const gamma = event.gamma ?? 0;
                const beta = Math.max(-45, Math.min(45, event.beta ?? 0));

                smoothedGamma += (gamma - smoothedGamma) * 0.15;
                smoothedBeta += (beta - smoothedBeta) * 0.15;

                const gravityScale = 1.4;
                engineRef.gravity.x = (smoothedGamma / 45) * gravityScale;
                engineRef.gravity.y =
                    Math.max(0.35, (smoothedBeta / 45 + 1) * 0.55 * gravityScale);
            };

            sensorHandlers.onMotion = (event: DeviceMotionEvent) => {
                if (!motionEnabled || !engineRef || !BodyRef) return;

                const acc = event.acceleration;
                if (
                    !acc ||
                    acc.x === null ||
                    acc.y === null ||
                    acc.z === null
                ) {
                    return;
                }

                const dx = acc.x - lastAccel.x;
                const dy = acc.y - lastAccel.y;
                const dz = acc.z - lastAccel.z;
                lastAccel = { x: acc.x, y: acc.y, z: acc.z };

                const intensity = Math.hypot(dx, dy, dz);
                const now = performance.now();
                if (intensity < 1.8 || now - lastShakeAt < 70) return;

                lastShakeAt = now;
                const forceScale = Math.min(intensity * 0.0009, 0.012);

                for (const body of worldBodies.values()) {
                    BodyRef.applyForce(body, body.position, {
                        x: dx * forceScale * body.mass,
                        y: dy * forceScale * body.mass,
                    });
                    Sleeping.set(body, false);
                    BodyRef.setAngularVelocity(
                        body,
                        body.angularVelocity +
                            (Math.random() - 0.5) * intensity * 0.04,
                    );
                }
            };

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
                    const x = body.position.x - (el.offsetWidth || 100) / 2;
                    const y = body.position.y - (el.offsetHeight || 28) / 2;
                    el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                }
                raf = requestAnimationFrame(frame);
            };

            raf = requestAnimationFrame(frame);

            let resizeRaf = 0;
            resizeObserver = new ResizeObserver(() => {
                if (resizeRaf) return;
                resizeRaf = requestAnimationFrame(() => {
                    resizeRaf = 0;
                    updateBoundaries();
                });
            });
            resizeObserver.observe(stage);
            sensorsReady = true;

            return () => {
                cancelAnimationFrame(raf);
                if (resizeRaf) cancelAnimationFrame(resizeRaf);
                resizeObserver?.disconnect();
                detachSensors();
                sensorHandlers.onOrientation = null;
                sensorHandlers.onMotion = null;
                sensorsReady = false;
                World.clear(engine.world, false);
                Engine.clear(engine);
                spawnPillFn = null;
                removePillFn = null;
                engineRef = null;
                BodyRef = null;
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

<section class="shake-wrap" aria-label="Interaktive Kompetenzen">
    <div class="physics-stage" bind:this={containerEl}>
        {#each competences as competence (competence.id)}
            {@const size = pillSizes[competence.id]}
            <div
                class="pill"
                class:is-sized={size}
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
    .shake-wrap {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .physics-stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        touch-action: none;
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
        max-width: 300px;
        min-height: 72px;
        padding: 0 24px;
        border-radius: 9999px;
        box-shadow: inset 0 0 0 2px var(--color-black);
        background: var(--pill-color);
        color: var(--color-black);
        user-select: none;
        cursor: grab;
        touch-action: none;
        pointer-events: auto;
        will-change: transform;
        visibility: hidden;
    }

    .pill:active {
        cursor: grabbing;
    }

    .pill.is-sized {
        visibility: visible;
    }

    .pill-inner {
        flex: 0 0 auto;
        width: var(--pill-inner-w, auto);
        min-width: 0;
        max-width: calc(300px - 48px);
    }

    .pill-title {
        display: block;
        min-width: 0;
        font-size: 1.125rem;
        line-height: 1.25;
        font-weight: 300;
        letter-spacing: 0.01em;
        text-align: center;
        overflow-wrap: normal;
        word-break: normal;
        hyphens: none;
    }
</style>
