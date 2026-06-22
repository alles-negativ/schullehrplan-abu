<script lang="ts">
    import { onMount } from "svelte";
    import MobileInfoMenu from "$lib/components/MobileInfoMenu.svelte";
    import MobileSensorPermissionModal from "$lib/components/MobileSensorPermissionModal.svelte";
    import MobileShakePhysics from "$lib/components/MobileShakePhysics.svelte";
    import { getAllCompetences, type Competence } from "$lib/data/education-modes";
    import type { MobileContent } from "$lib/data/mobile";
    import {
        createMobileMotionStatus,
        type MobileMotionControls,
        type MobileMotionStatus,
    } from "$lib/mobile-motion-status";

    type FallingCompetence = Competence & { id: string };

    let {
        mobile,
    }: {
        mobile: MobileContent;
    } = $props();

    let fallingCompetences = $state<FallingCompetence[]>([]);
    let motionStatus = $state<MobileMotionStatus>(createMobileMotionStatus());
    let motionControls = $state<MobileMotionControls | null>(null);
    let competencePool: Competence[] = [];
    let nextPillId = 0;

    const createFallingCompetence = (competence: Competence): FallingCompetence => ({
        ...competence,
        id: `mobile-pill-${nextPillId++}`,
    });

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
    <div class="physics-area">
        <MobileShakePhysics
            competences={fallingCompetences}
            bind:motionStatus
            bind:motionControls
        />
    </div>

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
    }
</style>
