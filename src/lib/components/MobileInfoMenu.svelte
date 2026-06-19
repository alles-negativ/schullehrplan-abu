<script lang="ts">
    import { onMount } from "svelte";
    import type { MobileMotionStatus } from "$lib/mobile-motion-status";

    let { motionStatus }: { motionStatus: MobileMotionStatus } = $props();

    let menuOpen = $state(false);
    let menuAnchorEl = $state<HTMLDivElement | null>(null);

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const closeMenu = () => {
        menuOpen = false;
    };

    onMount(() => {
        const onPointerDown = (event: PointerEvent) => {
            if (!menuOpen || !menuAnchorEl) return;
            const target = event.target;
            if (target instanceof Node && menuAnchorEl.contains(target)) return;
            closeMenu();
        };

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    });
</script>

<div class="mobile-info-menu" bind:this={menuAnchorEl}>
    <button
        type="button"
        class="menu-button"
        class:is-active={menuOpen}
        aria-expanded={menuOpen}
        aria-controls="mobile-info-panel"
        onclick={toggleMenu}
    >
        Info
    </button>

    <div
        id="mobile-info-panel"
        class="menu-panel"
        class:is-open={menuOpen}
        inert={!menuOpen}
    >
        <div class="menu-panel-scroll">
            {#if !motionStatus.assessmentComplete}
                <p class="menu-text">Steuerung wird geprüft…</p>
            {:else if motionStatus.permissionDenied}
                <p class="menu-text">
                    Bewegungszugriff wurde verweigert. Du kannst die
                    Kompetenzen trotzdem mit dem Finger verschieben.
                </p>
            {:else if motionStatus.permissionDeclined}
                <p class="menu-text">
                    Sensoren sind deaktiviert. Du kannst die Kompetenzen mit
                    dem Finger verschieben.
                </p>
            {:else if motionStatus.sensorsUnavailable}
                <p class="menu-text">
                    Bewegungssteuerung ist auf diesem Gerät nicht verfügbar.
                    Die Kompetenzen lassen sich mit dem Finger verschieben.
                </p>
            {:else if motionStatus.motionEnabled}
                <p class="menu-text">
                    Schüttle dein Gerät, um die Kompetenzen in Bewegung zu
                    setzen. Du kannst sie auch mit dem Finger verschieben.
                </p>
            {:else}
                <p class="menu-text">
                    Verschiebe die Kompetenzen mit dem Finger. Schütteln ist
                    auf diesem Gerät nicht verfügbar.
                </p>
            {/if}
        </div>
    </div>
</div>

<style>
    .mobile-info-menu {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 10;
        isolation: isolate;
    }

    .menu-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.75rem;
        padding: 0.4375rem 1.5625rem;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        font: inherit;
        font-size: 1.125rem;
        line-height: 1.25;
        font-weight: 300;
        letter-spacing: 0.01em;
        white-space: nowrap;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            filter 120ms ease;
    }

    .menu-button:hover,
    .menu-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .menu-button.is-active:hover {
        filter: brightness(1.2);
    }

    .menu-panel {
        position: fixed;
        top: calc(1rem + 2.75rem + 0.625rem);
        right: 1rem;
        left: 1rem;
        bottom: 1rem;
        z-index: 11;
        display: block;
        box-sizing: border-box;
        border: 1.5px solid var(--color-black);
        border-radius: 1rem;
        background: var(--color-white);
        padding: 1.25rem;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-0.625rem);
        pointer-events: none;
        transition:
            opacity 220ms ease-in-out,
            transform 220ms ease-in-out,
            visibility 0ms linear 220ms;
    }

    .menu-panel.is-open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: auto;
        transition:
            opacity 220ms ease-in-out,
            transform 220ms ease-in-out,
            visibility 0ms linear 0ms;
    }

    .menu-panel-scroll {
        height: 100%;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }

    .menu-text {
        margin: 0;
        font-size: 1.125rem;
        line-height: 1.4;
        font-weight: 300;
        letter-spacing: 0.01em;
        text-wrap: pretty;
    }

    @media (prefers-reduced-motion: reduce) {
        .menu-panel,
        .menu-button {
            transition: none;
        }
    }
</style>
