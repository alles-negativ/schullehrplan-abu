<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        assessMotionSensorReadiness,
        motionSensorsSupported,
        needsMotionPermission,
        readLateralTiltAngleFromGravity,
        readLateralTiltAngleFromOrientation,
        readMotionSample,
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
    import { getMobileScale } from "$lib/mobile-scale";

    type PhysicsPill = Competence & { id: string };

    type PillAnchor = {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
    };

    let {
        competences = [],
        dragging = $bindable(false),
        getPillAnchors = $bindable<(() => PillAnchor[]) | null>(null),
        motionStatus = $bindable(createMobileMotionStatus()),
        motionControls = $bindable<MobileMotionControls | null>(null),
        shakeVanishDurationMs = 3000,
        onShakeSustained,
    }: {
        competences?: PhysicsPill[];
        dragging?: boolean;
        getPillAnchors?: (() => PillAnchor[]) | null;
        motionStatus?: MobileMotionStatus;
        motionControls?: MobileMotionControls | null;
        shakeVanishDurationMs?: number;
        onShakeSustained?: () => void;
    } = $props();

    $effect(() => {
        getPillAnchors = () => {
            if (!containerEl) return [];

            const origin = containerEl.getBoundingClientRect();
            const anchors: PillAnchor[] = [];

            for (const [id, el] of itemElements) {
                if (!competences.some((competence) => competence.id === id)) {
                    continue;
                }

                const rect = el.getBoundingClientRect();
                if (!rect.width || !rect.height) continue;

                anchors.push({
                    id,
                    x: rect.left - origin.left + rect.width / 2,
                    y: rect.top - origin.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height,
                });
            }

            return anchors;
        };

        return () => {
            getPillAnchors = null;
        };
    });

    let containerEl = $state<HTMLDivElement | null>(null);
    let itemElements = new Map<string, HTMLDivElement>();
    let spawnPillFn: ((pill: PhysicsPill) => void) | null = null;
    let removePillFn: ((pillId: string) => void) | null = null;
    let pillSizes = $state<Record<string, { pill: number; inner: number }>>({});
    let spawnedPills = $state<Record<string, boolean>>({});
    let motionEnabled = $state(false);
    let needsPermission = $state(false);
    let permissionPending = $state(false);
    let motionAssessmentComplete = $state(false);
    let sensorsReady = $state(false);
    let sensorsUnavailable = $state(false);
    let permissionDenied = $state(false);
    let permissionDeclined = $state(false);

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

    const getPillMetrics = () => {
        const scale = getMobileScale();
        return {
            maxWidth: PILL_MAX_WIDTH * scale,
            hPadding: PILL_H_PADDING * scale,
            minContent: PILL_MIN_CONTENT * scale,
        };
    };

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
        const { maxWidth, hPadding, minContent } = getPillMetrics();
        const maxContent = maxWidth - hPadding;
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
            contentWidth = Math.max(oneLine, minContent);
        } else {
            const targetLines = Math.min(2, measureAt(maxContent).lines);

            let lo = minContent;
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
            pill: Math.round(contentWidth + hPadding),
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
                const { [pill.id]: _spawned, ...restSpawned } = spawnedPills;
                spawnedPills = restSpawned;
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

    const declineMotion = () => {
        permissionDeclined = true;
        needsPermission = false;
        motionEnabled = false;
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
            permissionDeclined,
            sensorsUnavailable,
        };
    });

    $effect(() => {
        motionControls = { enableMotion, declineMotion };
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
                Events,
                Sleeping,
            } = Matter;
            const engine = Engine.create();
            engineRef = engine;
            BodyRef = Body;
            engine.gravity.y = 1;
            engine.enableSleeping = true;
            const wallThickness = 200;
            const stagePadding = 2;

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
                const maxY = Math.max(minY, height / 2 - halfDiag);

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
                    dragging = false;
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
                    syncElementToBody(el, body);
                    worldBodies.set(pill.id, body);
                    bodySizes.set(pill.id, {
                        width: itemWidth,
                        height: itemHeight,
                    });
                    activeSlugs.add(pill.id);
                    World.add(engine.world, body);
                    spawnedPills = { ...spawnedPills, [pill.id]: true };
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
                Events.on(mouseConstraint, "startdrag", () => {
                    dragging = true;
                });
                Events.on(mouseConstraint, "enddrag", () => {
                    dragging = false;
                });
                World.add(engine.world, mouseConstraint);
            };

            spawnPillFn = spawnPill;
            removePillFn = removePill;
            updateBoundaries();
            setupMouse();

            let lastAccel = { x: 0, y: 0, z: 0 };
            let lastShakeAt = 0;
            let lastShakeActivityAt = 0;
            let shakeSessionStartAt: number | null = null;
            const SHAKE_INTENSITY_THRESHOLD = 1.8;
            const SHAKE_ACTIVITY_GAP_MS = 250;
            let smoothedGravityX = 0;
            let smoothedGravityY = 1;
            let lastAppliedGravity = { x: 0, y: 1 };
            const gravityStrength = 1.4;
            const gravitySmoothing = 0.18;

            const applyLateralTiltGravity = (angleRad: number) => {
                if (!engineRef || !motionEnabled) return;

                const targetX = Math.sin(angleRad) * gravityStrength;
                const targetY = Math.cos(angleRad) * gravityStrength;

                smoothedGravityX +=
                    (targetX - smoothedGravityX) * gravitySmoothing;
                smoothedGravityY +=
                    (targetY - smoothedGravityY) * gravitySmoothing;

                engineRef.gravity.x = smoothedGravityX;
                engineRef.gravity.y = smoothedGravityY;

                if (
                    Math.hypot(
                        smoothedGravityX - lastAppliedGravity.x,
                        smoothedGravityY - lastAppliedGravity.y,
                    ) > 0.04
                ) {
                    lastAppliedGravity = {
                        x: smoothedGravityX,
                        y: smoothedGravityY,
                    };
                    wakeAllPills();
                }
            };

            sensorHandlers.onOrientation = (event: DeviceOrientationEvent) => {
                const angle = readLateralTiltAngleFromOrientation(event);
                if (angle === null) return;
                applyLateralTiltGravity(angle);
            };

            sensorHandlers.onMotion = (event: DeviceMotionEvent) => {
                if (!motionEnabled || !engineRef || !BodyRef) return;

                const angle = readLateralTiltAngleFromGravity(event);
                if (angle !== null) {
                    applyLateralTiltGravity(angle);
                }

                const acc = readMotionSample(event);
                if (!acc) return;

                const dx = acc.x - lastAccel.x;
                const dy = acc.y - lastAccel.y;
                const dz = acc.z - lastAccel.z;
                lastAccel = acc;

                const intensity = Math.hypot(dx, dy, dz);
                const now = performance.now();

                if (intensity >= SHAKE_INTENSITY_THRESHOLD) {
                    if (
                        shakeSessionStartAt !== null &&
                        now - lastShakeActivityAt > SHAKE_ACTIVITY_GAP_MS
                    ) {
                        shakeSessionStartAt = null;
                    }

                    lastShakeActivityAt = now;

                    if (shakeSessionStartAt === null) {
                        shakeSessionStartAt = now;
                    } else if (
                        now - shakeSessionStartAt >=
                        shakeVanishDurationMs
                    ) {
                        onShakeSustained?.();
                        shakeSessionStartAt = now;
                    }
                }

                if (
                    intensity < SHAKE_INTENSITY_THRESHOLD ||
                    now - lastShakeAt < 70
                ) {
                    return;
                }

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
            let resizeObserverActive = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resizeObserverActive = true;
                });
            });

            const syncBodiesToElements = () => {
                const width = containerEl?.clientWidth ?? 0;
                const height = containerEl?.clientHeight ?? 0;

                for (const slug of activeSlugs) {
                    const body = worldBodies.get(slug);
                    const el = itemElements.get(slug);
                    const prev = bodySizes.get(slug);
                    if (!body || !el || !prev) continue;

                    const w = el.offsetWidth;
                    const h = el.offsetHeight;
                    if (!w || !h) continue;

                    const sx = w / prev.width;
                    const sy = h / prev.height;
                    if (Math.abs(sx - 1) > 0.005 || Math.abs(sy - 1) > 0.005) {
                        Body.scale(body, sx, sy);
                        bodySizes.set(slug, { width: w, height: h });
                        Sleeping.set(body, false);
                    }

                    if (width && height) clampBodyToStage(body, width, height);
                    syncElementToBody(el, body);
                }
            };

            resizeObserver = new ResizeObserver(() => {
                if (!resizeObserverActive || resizeRaf) return;
                resizeRaf = requestAnimationFrame(() => {
                    resizeRaf = 0;
                    for (const [id, el] of itemElements) {
                        fitPillWidth(el, id);
                    }
                    updateBoundaries();
                    void tick().then(() => {
                        requestAnimationFrame(syncBodiesToElements);
                    });
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
                class:is-spawned={spawnedPills[competence.id]}
                style:--pill-color={competence.color ?? "#64748b"}
                style:--pill-w={size ? `${size.pill}px` : undefined}
                style:--pill-inner-w={size ? `${size.inner}px` : undefined}
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
        max-width: var(--pill-max-width, 300px);
        min-height: calc(72px * var(--mobile-scale, 1));
        padding: 0 calc(24px * var(--mobile-scale, 1));
        border-radius: 9999px;
        /* box-shadow: inset 0 0 0 1.5px var(--color-black); */
        border: max(1px, calc(1.5px * var(--mobile-scale, 1))) solid
            var(--color-black);
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

    .pill.is-sized.is-spawned {
        visibility: visible;
    }

    .pill-inner {
        flex: 0 0 auto;
        width: var(--pill-inner-w, auto);
        min-width: 0;
        max-width: calc(
            var(--pill-max-width, 300px) - var(--pill-h-padding, 48px)
        );
    }

    .pill-title {
        display: block;
        min-width: 0;
        font-size: calc(18px * var(--mobile-scale, 1));
        line-height: 1.25;
        font-weight: 400;
        letter-spacing: 0.01em;
        text-align: center;
        overflow-wrap: normal;
        word-break: normal;
        hyphens: none;
    }
</style>
