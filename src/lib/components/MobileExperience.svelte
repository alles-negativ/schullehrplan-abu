<script lang="ts">
    import { onMount } from "svelte";
    import MobileInfoMenu from "$lib/components/MobileInfoMenu.svelte";
    import MobilePillControls from "$lib/components/MobilePillControls.svelte";
    import MobileSensorPermissionModal from "$lib/components/MobileSensorPermissionModal.svelte";
    import MobileShakePhysics from "$lib/components/MobileShakePhysics.svelte";
    import { getAllCompetences, type Competence } from "$lib/data/education-modes";
    import {
        createMobileMotionStatus,
        type MobileMotionControls,
        type MobileMotionStatus,
    } from "$lib/mobile-motion-status";

    type FallingCompetence = Competence & { id: string };

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let motionStatus = $state<MobileMotionStatus>(createMobileMotionStatus());
    let motionControls = $state<MobileMotionControls | null>(null);
    let competencePool: Competence[] = [];
    let nextPillId = 0;

    const createFallingCompetence = (competence: Competence): FallingCompetence => ({
        ...competence,
        id: `mobile-pill-${nextPillId++}`,
    });

    const addPill = () => {
        if (!competencePool.length) return;

        const competence =
            competencePool[Math.floor(Math.random() * competencePool.length)];
        fallingCompetences = [
            ...fallingCompetences,
            createFallingCompetence(competence),
        ];
    };

    const removePill = () => {
        if (!fallingCompetences.length) return;
        fallingCompetences = fallingCompetences.slice(0, -1);
    };

    onMount(() => {
        competencePool = getAllCompetences();
        const shuffled = [...competencePool].sort(() => Math.random() - 0.5);
        const count = 5 + Math.floor(Math.random() * 3);

        fallingCompetences = shuffled
            .slice(0, count)
            .map((competence) => createFallingCompetence(competence));
    });
</script>

<main class="mobile-experience">
    <div class="mobile-hero">
        <p class="mobile-hero-text">
            Ich bin der neue Schullehrplan Allgemeinbildung.
            <br />
            Schüttle dein Gerät und sieh, wie die Kompetenzen reagieren.
        </p>
    </div>

    <div class="physics-area">
        <MobileShakePhysics
            competences={fallingCompetences}
            bind:motionStatus
            bind:motionControls
        />
    </div>

    <MobilePillControls
        canRemove={fallingCompetences.length > 0}
        onAdd={addPill}
        onRemove={removePill}
    />

    <MobileSensorPermissionModal
        {motionStatus}
        onAccept={() => motionControls?.enableMotion()}
        onDecline={() => motionControls?.declineMotion()}
    />

    <MobileInfoMenu {motionStatus} />
</main>

<style>
    .mobile-experience {
        position: fixed;
        inset: 0;
        background: var(--color-background);
        overflow: hidden;
    }

    .mobile-hero {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        pointer-events: none;
    }

    .mobile-hero-text {
        margin: 0;
        max-width: 22rem;
        font-size: 1.25rem;
        line-height: 1.35;
        font-weight: 300;
        letter-spacing: 0.01em;
        text-align: center;
        text-wrap: balance;
    }

    .physics-area {
        position: absolute;
        inset: 0;
        z-index: 2;
    }
</style>
