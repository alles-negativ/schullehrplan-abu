<script lang="ts">
    import { onMount } from "svelte";
    import { marked } from "marked";
    import type { MobileContent } from "$lib/data/mobile";
    import type { MobileMotionStatus } from "$lib/mobile-motion-status";

    let {
        motionStatus,
        mobile,
    }: {
        motionStatus: MobileMotionStatus;
        mobile: MobileContent;
    } = $props();

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
        Schullehrplan ABU
    </button>

    <div
        id="mobile-info-panel"
        class="menu-panel"
        class:is-open={menuOpen}
        inert={!menuOpen}
    >
        <div class="menu-panel-scroll">
            {#if mobile.intro}
                <div class="menu-intro">
                    {@html marked.parse(mobile.intro) as string}
                </div>
            {/if}

            {#if mobile.content}
                <div class="menu-content">
                    {@html marked.parse(mobile.content) as string}
                </div>
            {/if}

            <!-- {#if !motionStatus.assessmentComplete}
                <p class="menu-text">Steuerung wird geprüft…</p>
            {:else if motionStatus.permissionDenied}
                <p class="menu-text">
                    Bewegungszugriff wurde verweigert. Du kannst die Kompetenzen
                    trotzdem mit dem Finger verschieben.
                </p>
            {:else if motionStatus.permissionDeclined}
                <p class="menu-text">
                    Sensoren sind deaktiviert. Du kannst die Kompetenzen mit dem
                    Finger verschieben.
                </p>
            {:else if motionStatus.sensorsUnavailable}
                <p class="menu-text">
                    Bewegungssteuerung ist auf diesem Gerät nicht verfügbar. Die
                    Kompetenzen lassen sich mit dem Finger verschieben.
                </p>
            {:else if motionStatus.motionEnabled}
                <p class="menu-text">
                    Schüttle dein Gerät, um die Kompetenzen in Bewegung zu
                    setzen. Du kannst sie auch mit dem Finger verschieben.
                </p>
            {:else}
                <p class="menu-text">
                    Verschiebe die Kompetenzen mit dem Finger. Schütteln ist auf
                    diesem Gerät nicht verfügbar.
                </p>
            {/if} -->
        </div>
    </div>
</div>

<style>
    .mobile-info-menu {
        position: absolute;
        top: 1rem;
        left: 1rem;
        z-index: 10;
        isolation: isolate;
    }

    button.menu-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.5rem;
        padding: 0.4375rem 1.125rem;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: 400;
        letter-spacing: var(--h5-letter-spacing);
        white-space: nowrap;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            filter 120ms ease;
    }

    @media (hover: hover) {
        button.menu-button:hover {
            background: var(--color-darkblue);
            color: var(--color-white);
        }
    }

    button.menu-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    @media (hover: hover) {
        button.menu-button.is-active:hover {
            filter: brightness(1.2);
        }
    }

    .menu-panel {
        --panel-max-height: calc(100vh - 1rem - 2.5rem - 0.625rem - 1rem);
        position: fixed;
        top: calc(1rem + 2.5rem + 0.625rem);
        right: 1rem;
        left: 1rem;
        max-height: var(--panel-max-height);
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
        max-height: calc(var(--panel-max-height) - 2.5rem);
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .menu-panel-scroll::-webkit-scrollbar {
        display: none;
    }

    .menu-intro {
        margin: 0 0 1.25rem;
        text-align: center;
        text-wrap: balance;
    }

    .menu-intro :global(p) {
        margin: 0;
        font-size: 26px;
        line-height: var(--h3-line-height);
        font-weight: 400;
        letter-spacing: var(--h3-letter-spacing);
        /* text-align: center; */
    }

    .menu-intro :global(p + p) {
        margin-top: 0.75rem;
    }

    .menu-content {
        /* margin: 0 0 1.25rem; */
    }

    .menu-content :global(h2) {
        margin: 1.25rem 0 0;
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: 500;
        letter-spacing: var(--h3-letter-spacing);
    }

    .menu-content :global(h2:first-child) {
        margin-top: 0;
    }

    .menu-content :global(p) {
        margin: 0;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: 400;
        letter-spacing: var(--h5-letter-spacing);
    }

    .menu-content :global(p + p) {
        margin-top: 0.3rem;
    }

    .menu-content :global(strong) {
        font-weight: 600;
    }

    .menu-content :global(a) {
        color: var(--color-black);
        border-bottom: 1px solid var(--color-black);
    }

    .menu-content :global(h2) {
        margin: 0.75rem 0 0;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: 500;
        letter-spacing: var(--h5-letter-spacing);
    }

    .menu-content :global(h2:first-child) {
        margin-top: 0;
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
        button.menu-button {
            transition: none;
        }
    }
</style>
