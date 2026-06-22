<script lang="ts">
    import { onMount } from "svelte";
    import MobileInfoMenu from "$lib/components/MobileInfoMenu.svelte";
    import MobilePoofEffects, {
        type PoofBurst,
    } from "$lib/components/MobilePoofEffects.svelte";
    import MobileSensorPermissionModal from "$lib/components/MobileSensorPermissionModal.svelte";
    import MobileShakePhysics from "$lib/components/MobileShakePhysics.svelte";
    import {
        getAllCompetences,
        getAspectByTitle,
        type Competence,
    } from "$lib/data/education-modes";
    import type { MobileContent } from "$lib/data/mobile";
    import {
        createMobileMotionStatus,
        type MobileMotionControls,
        type MobileMotionStatus,
    } from "$lib/mobile-motion-status";

    const aspectOrder = [
        "Gesellschaftliche Inhalte",
        "Sprachmodi",
        "Schlüsselkompetenzen",
    ] as const;

    const SHAKE_BEFORE_DROP_MS = 800;
    const POOF_DURATION_MS = 300;
    const PILL_SPAWN_INTERVAL_MIN_MS = 90;
    const PILL_SPAWN_INTERVAL_MAX_MS = 280;
    const PILL_VANISH_INTERVAL_MIN_MS = 50;
    const PILL_VANISH_INTERVAL_MAX_MS = 140;

    type PillAnchor = {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
    };

    type FallingCompetence = Competence & { id: string };

    let {
        mobile,
    }: {
        mobile: MobileContent;
    } = $props();

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let displayedAspect = $state<(typeof aspectOrder)[number] | null>(null);
    let isShaking = $state(false);
    let pillDragging = $state(false);
    let heroShakeKey = $state(0);
    let motionStatus = $state<MobileMotionStatus>(createMobileMotionStatus());
    let motionControls = $state<MobileMotionControls | null>(null);
    let nextPillId = 0;
    let nextPoofId = 0;
    let aspectDropTimeout: ReturnType<typeof setTimeout> | null = null;
    let pillSpawnTimeouts: ReturnType<typeof setTimeout>[] = [];
    let vanishTimeouts: ReturnType<typeof setTimeout>[] = [];
    let poofRemoveTimeouts: ReturnType<typeof setTimeout>[] = [];
    let getPillAnchors = $state<(() => PillAnchor[]) | null>(null);
    let poofBursts = $state<PoofBurst[]>([]);

    const createFallingCompetence = (
        competence: Competence,
    ): FallingCompetence => ({
        ...competence,
        id: `mobile-pill-${nextPillId++}`,
    });

    const randomSpawnInterval = () =>
        PILL_SPAWN_INTERVAL_MIN_MS +
        Math.random() *
            (PILL_SPAWN_INTERVAL_MAX_MS - PILL_SPAWN_INTERVAL_MIN_MS);

    const clearPillSpawnTimeouts = () => {
        for (const timeout of pillSpawnTimeouts) {
            clearTimeout(timeout);
        }
        pillSpawnTimeouts = [];
    };

    const spawnPillsFromAspect = (
        aspect: (typeof aspectOrder)[number],
        count: number,
    ) => {
        clearPillSpawnTimeouts();

        const pool = getAllCompetences().filter(
            (competence) => competence.aspect === aspect,
        );
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(count, pool.length));

        let delay = 0;
        for (const competence of picked) {
            const spawnDelay = delay;
            const timeout = setTimeout(() => {
                fallingCompetences = [
                    ...fallingCompetences,
                    createFallingCompetence(competence),
                ];
                pillSpawnTimeouts = pillSpawnTimeouts.filter(
                    (entry) => entry !== timeout,
                );
            }, spawnDelay);
            pillSpawnTimeouts.push(timeout);
            delay += randomSpawnInterval();
        }
    };

    const pickRandomAspect = (
        exclude?: (typeof aspectOrder)[number] | null,
    ) => {
        const pool = exclude
            ? aspectOrder.filter((aspect) => aspect !== exclude)
            : aspectOrder;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const randomVanishInterval = () =>
        PILL_VANISH_INTERVAL_MIN_MS +
        Math.random() *
            (PILL_VANISH_INTERVAL_MAX_MS - PILL_VANISH_INTERVAL_MIN_MS);

    const clearPoofRemoveTimeouts = () => {
        for (const timeout of poofRemoveTimeouts) {
            clearTimeout(timeout);
        }
        poofRemoveTimeouts = [];
    };

    const clearVanishTimeouts = () => {
        for (const timeout of vanishTimeouts) {
            clearTimeout(timeout);
        }
        vanishTimeouts = [];
    };

    const vanishPillsWithPoof = () => {
        clearPillSpawnTimeouts();
        clearVanishTimeouts();
        clearPoofRemoveTimeouts();
        poofBursts = [];

        const anchors = [...(getPillAnchors?.() ?? [])].sort(
            () => Math.random() - 0.5,
        );

        if (!anchors.length) {
            fallingCompetences = [];
            return;
        }

        let delay = 0;
        for (const anchor of anchors) {
            const burstId = `poof-${nextPoofId++}`;
            const vanishDelay = delay;
            const timeout = setTimeout(() => {
                poofBursts = [
                    ...poofBursts,
                    {
                        id: burstId,
                        x: anchor.x,
                        y: anchor.y,
                        size: Math.max(anchor.width, anchor.height, 48) * 0.45,
                    },
                ];
                fallingCompetences = fallingCompetences.filter(
                    (competence) => competence.id !== anchor.id,
                );

                const removePoofTimeout = setTimeout(() => {
                    poofBursts = poofBursts.filter(
                        (burst) => burst.id !== burstId,
                    );
                    poofRemoveTimeouts = poofRemoveTimeouts.filter(
                        (entry) => entry !== removePoofTimeout,
                    );
                }, POOF_DURATION_MS);
                poofRemoveTimeouts.push(removePoofTimeout);

                vanishTimeouts = vanishTimeouts.filter(
                    (entry) => entry !== timeout,
                );
            }, vanishDelay);
            vanishTimeouts.push(timeout);
            delay += randomVanishInterval();
        }
    };

    const clearAspectDropTimeout = () => {
        if (aspectDropTimeout) {
            clearTimeout(aspectDropTimeout);
            aspectDropTimeout = null;
        }
    };

    const scheduleAspectPills = (
        aspect: (typeof aspectOrder)[number],
        withShake = false,
    ) => {
        clearAspectDropTimeout();
        clearPillSpawnTimeouts();
        clearVanishTimeouts();
        clearPoofRemoveTimeouts();
        vanishPillsWithPoof();

        if (withShake) {
            isShaking = true;
            heroShakeKey += 1;
        }

        aspectDropTimeout = setTimeout(() => {
            displayedAspect = aspect;
            isShaking = false;
            spawnPillsFromAspect(aspect, 4 + Math.floor(Math.random() * 3));
            aspectDropTimeout = null;
        }, SHAKE_BEFORE_DROP_MS);
    };

    const handleAspectClick = () => {
        if (pillDragging || isShaking) return;

        const aspect = pickRandomAspect(displayedAspect);
        scheduleAspectPills(aspect, true);
    };

    const aspectColor = $derived(
        displayedAspect
            ? (getAspectByTitle(displayedAspect)?.color ?? "#FF9193")
            : "var(--color-white)",
    );

    onMount(() => {
        const aspect = pickRandomAspect();
        displayedAspect = aspect;
        scheduleAspectPills(aspect, true);

        return () => {
            clearAspectDropTimeout();
            clearPoofRemoveTimeouts();
            clearVanishTimeouts();
            clearPillSpawnTimeouts();
        };
    });
</script>

<main class="mobile-experience">
    <div class="physics-area">
        <MobileShakePhysics
            competences={fallingCompetences}
            bind:dragging={pillDragging}
            bind:getPillAnchors
            bind:motionStatus
            bind:motionControls
        />
        <MobilePoofEffects bursts={poofBursts} />
    </div>

    {#if displayedAspect || isShaking}
        <div class="aspect-hero">
            {#key heroShakeKey}
                <button
                    type="button"
                    class="aspect-button"
                    style={`--button-color: ${aspectColor}`}
                    disabled={pillDragging || isShaking}
                    onclick={handleAspectClick}
                >
                    {#if displayedAspect === "Schlüsselkompetenzen"}
                        Schlüssel-kompetenzen
                    {:else if displayedAspect}
                        {displayedAspect}
                    {/if}
                </button>
            {/key}
        </div>
    {/if}

    <MobileSensorPermissionModal
        {motionStatus}
        onAccept={() => motionControls?.enableMotion()}
        onDecline={() => motionControls?.declineMotion()}
    />

    <MobileInfoMenu {motionStatus} {mobile} />
</main>

<style>
    .mobile-experience {
        position: fixed;
        inset: 0;
        background: var(--color-background);
        overflow: hidden;
    }

    .physics-area {
        position: absolute;
        inset: 0;
        isolation: isolate;
    }

    .aspect-hero {
        position: absolute;
        inset: 0;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        pointer-events: none;
    }

    .aspect-button {
        pointer-events: auto;
        width: min(100%, 17rem);
        min-height: 4.5rem;
        padding: 0rem 1.5rem;
        height: 8rem;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--button-color);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        color: var(--color-black);
        font-size: var(--h3-size);
        line-height: 1.12;
        font-weight: 300;
        letter-spacing: var(--h2-letter-spacing);
        white-space: pre-line;
        text-align: center;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        transition: filter 160ms ease;
        animation: mobile-aspect-shake 1.2s 0.1s 1;
    }

    .aspect-button:active:not(:disabled) {
        animation: none;
    }

    .aspect-button:disabled {
        pointer-events: none;
        cursor: default;
    }

    @keyframes mobile-aspect-shake-loop {
        0%,
        50%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        10% {
            transform: rotate(-1deg) translateX(-4px);
        }
        20% {
            transform: rotate(1deg) translateX(4px);
        }
        30% {
            transform: rotate(-0.75deg) translateX(-4px);
        }
        40% {
            transform: rotate(0.75deg) translateX(4px);
        }
    }

    @keyframes mobile-aspect-shake {
        0%,
        50%,
        100% {
            transform: rotate(0deg) translateX(0);
        }
        10% {
            transform: rotate(-1deg) translateX(-4px);
        }
        20% {
            transform: rotate(1deg) translateX(4px);
        }
        30% {
            transform: rotate(-0.75deg) translateX(-4px);
        }
        40% {
            transform: rotate(0.75deg) translateX(4px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .aspect-button {
            animation: none;
        }
    }
</style>
