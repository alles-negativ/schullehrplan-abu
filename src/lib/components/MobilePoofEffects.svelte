<script lang="ts">
    import poofSprite from "$lib/assets/Poof.png";

    export type PoofBurst = {
        id: string;
        x: number;
        y: number;
        size: number;
    };

    const POOF_FRAME_COUNT = 5;

    let { bursts = [] }: { bursts?: PoofBurst[] } = $props();
</script>

<div class="poof-layer" style={`--poof-sprite: url(${poofSprite})`} aria-hidden="true">
    {#each bursts as burst (burst.id)}
        <div
            class="poof"
            style={`--poof-frame-count: ${POOF_FRAME_COUNT}; left: ${burst.x}px; top: ${burst.y}px; width: ${burst.size}px; height: ${burst.size}px;`}
        ></div>
    {/each}
</div>

<style>
    .poof-layer {
        position: absolute;
        inset: 0;
        z-index: 4;
        pointer-events: none;
        overflow: hidden;
    }

    .poof {
        position: absolute;
        transform: translate(-50%, -50%);
        background-image: var(--poof-sprite);
        background-repeat: no-repeat;
        background-size: calc(var(--poof-frame-count) * 100%) 100%;
        background-position: 0% 0;
        mix-blend-mode: screen;
        /* 5 frames → 4 steps between positions 0%, 25%, 50%, 75%, 100% */
        animation: poof-play 0.3s steps(4, end) forwards;
    }

    @keyframes poof-play {
        from {
            background-position: 0% 0;
        }
        to {
            background-position: 100% 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .poof {
            animation: none;
            opacity: 0;
        }
    }
</style>
