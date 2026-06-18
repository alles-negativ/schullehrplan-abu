<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount, tick } from "svelte";
    import { needsMotionPermission } from "$lib/device-motion";
    import type { Competence } from "$lib/data/education-modes";
    import {
        createMatterTimestepState,
        stepMatterPhysics,
    } from "$lib/matter-timestep";

    type PhysicsPill = Competence & { id: string };

    type MotionEventConstructor = typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<PermissionState>;
    };

    type OrientationEventConstructor = typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<PermissionState>;
    };

    const getMotionEventCtor = (): MotionEventConstructor | undefined =>
        browser ? window.DeviceMotionEvent : undefined;

    const getOrientationEventCtor = ():
        | OrientationEventConstructor
        | undefined => (browser ? window.DeviceOrientationEvent : undefined);

    const motionSensorsSupported = (): boolean =>
        Boolean(getMotionEventCtor() && getOrientationEventCtor());

    let {
        competences = [],
    }: { competences?: PhysicsPill[] } = $props();

    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLDivElement>();
    let spawnPillFn: ((pill: PhysicsPill) => void) | null = null;
    let pillSizes = $state<Record<string, { pill: number; inner: number }>>({});
    let motionEnabled = $state(false);
    let needsPermission = $state(false);
    let permissionPending = $state(false);
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
                itemElements.delete(pill.id);
                const { [pill.id]: _, ...rest } = pillSizes;
                pillSizes = rest;
            },
        };
    };

    const requestMotionAccess = async () => {
        if (!motionSensorsSupported()) return false;

        permissionPending = true;
        try {
            const motionEvent = getMotionEventCtor();
            const orientationEvent = getOrientationEventCtor();
            if (!motionEvent || !orientationEvent) return false;

            if (typeof motionEvent.requestPermission === "function") {
                const motionResult = await motionEvent.requestPermission();
                if (motionResult !== "granted") return false;
            }

            if (typeof orientationEvent.requestPermission === "function") {
                const orientationResult =
                    await orientationEvent.requestPermission();
                if (orientationResult !== "granted") return false;
            }

            return true;
        } finally {
            permissionPending = false;
        }
    };

    const enableMotion = async () => {
        const granted = await requestMotionAccess();
        if (granted) {
            motionEnabled = true;
            needsPermission = false;
        }
    };

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
        sensorsUnavailable = !motionSensorsSupported();
        needsPermission = needsMotionPermission();
        if (!needsPermission && motionSensorsSupported()) {
            motionEnabled = true;
        }

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

        const setup = async () => {
            const Matter = await import("matter-js");
            const {
                Engine,
                World,
                Bodies,
                Body,
                Sleeping,
            } = Matter;
            const engine = Engine.create();
            engineRef = engine;
            BodyRef = Body;
            engine.gravity.y = 1;
            engine.enableSleeping = true;
            const wallThickness = 200;
            const stagePadding = 2;
            const sideWallTopExtension = 400;

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
                    const halfH = itemHeight / 2;
                    const halfDiag = Math.hypot(itemWidth / 2, halfH);
                    const x =
                        halfDiag +
                        Math.random() * Math.max(width - halfDiag * 2, 1);
                    const y = -(halfH + 40 + Math.random() * 120);
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

            spawnPillFn = spawnPill;
            updateBoundaries();

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
    {#if needsPermission && !motionEnabled}
        <div class="permission-overlay">
            <p class="permission-text">
                Schüttle dein Gerät, um die Kompetenzen in Bewegung zu setzen.
            </p>
            <button
                type="button"
                class="permission-button"
                disabled={permissionPending}
                onclick={enableMotion}
            >
                {permissionPending ? "Wird aktiviert…" : "Bewegung aktivieren"}
            </button>
        </div>
    {:else if sensorsUnavailable}
        <div class="permission-overlay permission-overlay--info">
            <p class="permission-text">
                Bewegungssteuerung ist auf diesem Gerät nicht verfügbar. Die
                Kompetenzen fallen dennoch herunter.
            </p>
        </div>
    {/if}

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

    .permission-overlay {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        padding: 2rem;
        background: rgba(240, 244, 246, 0.92);
        text-align: center;
        pointer-events: none;
    }

    .permission-overlay:not(.permission-overlay--info) {
        pointer-events: auto;
    }

    .permission-overlay--info {
        align-items: flex-end;
        justify-content: flex-start;
        background: transparent;
        padding: 1rem 1.25rem;
    }

    .permission-overlay--info .permission-text {
        max-width: none;
        font-size: 0.95rem;
        opacity: 0.75;
    }

    .permission-text {
        margin: 0;
        max-width: 18rem;
        font-size: 1.125rem;
        line-height: 1.4;
        font-weight: 400;
    }

    .permission-hint {
        margin: 0;
        max-width: 18rem;
        font-size: 0.95rem;
        line-height: 1.35;
        color: #8a1f1f;
    }

    .permission-button {
        padding: 0.85rem 1.5rem;
        border: 2px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        font: inherit;
        font-size: 1rem;
        cursor: pointer;
    }

    .permission-button:disabled {
        opacity: 0.6;
        cursor: wait;
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
        will-change: transform;
        visibility: hidden;
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
