<script lang="ts">
    import { onMount } from "svelte";
    import { marked } from "marked";
    import mobileCloseIcon from "$lib/assets/mobile-close.svg";
    import type { MobileContent } from "$lib/data/mobile";
    import type { MobileMotionStatus } from "$lib/mobile-motion-status";

    const PANEL_RADIUS_PX = 35;
    const PANEL_BORDER_PX = 1.5;
    const ARROW_LEFT_REM = 1.5;
    const ARROW_WIDTH_REM = 3.25;
    const ARROW_VIEWBOX_WIDTH = 58;
    const ARROW_VIEWBOX_HEIGHT = 44;
    const AUTO_OPEN_DELAY_MS = 10_000;

    let {
        motionStatus,
        mobile,
    }: {
        motionStatus: MobileMotionStatus;
        mobile: MobileContent;
    } = $props();

    let menuOpen = $state(false);
    let menuAnchorEl = $state<HTMLDivElement | null>(null);
    let menuPanelEl = $state<HTMLDivElement | null>(null);
    let outlinePath = $state("");
    let outlineSize = $state({ width: 0, height: 0 });
    let hasAutoOpened = $state(false);
    let autoOpenTimer: ReturnType<typeof setTimeout> | null = null;

    const sensorModalVisible = $derived(
        motionStatus.assessmentComplete &&
            motionStatus.needsPermission &&
            !motionStatus.motionEnabled &&
            !motionStatus.permissionDenied &&
            !motionStatus.permissionDeclined,
    );

    const remPx = (rem: number) =>
        rem *
        parseFloat(getComputedStyle(document.documentElement).fontSize || "16");

    const mapArrowPoint = (
        x: number,
        y: number,
        arrowLeft: number,
        baseY: number,
        scaleX: number,
        scaleY: number,
    ) => `${arrowLeft + x * scaleX},${baseY + y * scaleY}`;

    const buildOutlinePath = (width: number, height: number) => {
        const r = PANEL_RADIUS_PX;
        const arrowLeft = remPx(ARROW_LEFT_REM);
        const arrowWidth = remPx(ARROW_WIDTH_REM);
        const arrowHeight =
            arrowWidth * (ARROW_VIEWBOX_HEIGHT / ARROW_VIEWBOX_WIDTH);
        const scaleX = arrowWidth / ARROW_VIEWBOX_WIDTH;
        const scaleY = arrowHeight / ARROW_VIEWBOX_HEIGHT;
        const baseY = height;
        const overhang = 42.5683 * scaleY;

        const attachR = arrowLeft + 56.6543 * scaleX;
        const attachL = arrowLeft + 29.6055 * scaleX;
        const map = (x: number, y: number) =>
            mapArrowPoint(x, y, arrowLeft, baseY, scaleX, scaleY);

        const path = [
            `M ${r},0`,
            `H ${width - r}`,
            `A ${r} ${r} 0 0 1 ${width},${r}`,
            `V ${height - r}`,
            `A ${r} ${r} 0 0 1 ${width - r},${height}`,
            `H ${attachR}`,
            `C ${map(53.5864, 14.4507)} ${map(43.6794, 49.5358)} ${map(1.91162, 42.5683)}`,
            `C ${map(21.8875, 35.0202)} ${map(32.0597, 23.5181)} ${attachL},${height}`,
            `H ${r}`,
            `A ${r} ${r} 0 0 1 0,${height - r}`,
            `V ${r}`,
            `A ${r} ${r} 0 0 1 ${r},0`,
            "Z",
        ].join(" ");

        return { path, overhang };
    };

    const updateOutlinePath = () => {
        if (!menuPanelEl) return;
        const width = menuPanelEl.offsetWidth;
        const height = menuPanelEl.offsetHeight;
        const { path, overhang } = buildOutlinePath(width, height);
        outlinePath = path;
        outlineSize = { width, height: height + overhang };
    };

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const closeMenu = () => {
        menuOpen = false;
    };

    $effect(() => {
        if (
            hasAutoOpened ||
            autoOpenTimer !== null ||
            !motionStatus.assessmentComplete ||
            sensorModalVisible
        ) {
            return;
        }

        autoOpenTimer = setTimeout(() => {
            autoOpenTimer = null;
            if (!hasAutoOpened) {
                hasAutoOpened = true;
                menuOpen = true;
            }
        }, AUTO_OPEN_DELAY_MS);
    });

    $effect(() => {
        if (!menuPanelEl) return;

        menuOpen;
        updateOutlinePath();

        const resizeObserver = new ResizeObserver(() => {
            updateOutlinePath();
        });
        resizeObserver.observe(menuPanelEl);

        return () => resizeObserver.disconnect();
    });

    onMount(() => {
        const onPointerDown = (event: PointerEvent) => {
            if (!menuOpen || !menuAnchorEl) return;
            const target = event.target;
            if (target instanceof Node && menuAnchorEl.contains(target)) return;
            closeMenu();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && menuOpen) closeMenu();
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            if (autoOpenTimer) clearTimeout(autoOpenTimer);
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
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
        bind:this={menuPanelEl}
        inert={!menuOpen}
    >
        {#if outlinePath}
            <svg
                class="menu-panel-outline"
                aria-hidden="true"
                width={outlineSize.width}
                height={outlineSize.height}
                viewBox="0 0 {outlineSize.width} {outlineSize.height}"
            >
                <path
                    d={outlinePath}
                    fill="var(--color-white)"
                    stroke="var(--color-black)"
                    stroke-width={PANEL_BORDER_PX}
                    stroke-linejoin="round"
                    stroke-linecap="round"
                    vector-effect="non-scaling-stroke"
                />
            </svg>
        {/if}

        <button
            type="button"
            class="menu-panel-close"
            aria-label="Schliessen"
            onclick={closeMenu}
        >
            <img src={mobileCloseIcon} alt="" class="menu-panel-close-icon" />
        </button>

        <div class="menu-panel-scroll">
            {#if mobile.intro}
                <div class="menu-intro" lang="de">
                    {@html marked.parse(mobile.intro) as string}
                </div>
            {/if}

            {#if mobile.content}
                <div class="menu-content" lang="de">
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
        --menu-close-row: calc(2.5rem + 0.75rem);
        position: fixed;
        top: calc(1rem + 2.5rem + 0.625rem);
        left: 1rem;
        width: min(calc(100vw - 2rem), 400px);
        max-height: var(--panel-max-height);
        z-index: 11;
        display: block;
        box-sizing: border-box;
        border: none;
        border-radius: 0;
        background: transparent;
        padding: 1.25rem 1.25rem 1.5rem;
        overflow: visible;
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

    .menu-panel-close {
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        z-index: 2;
        display: inline-grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        padding: 0;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-darkblue);
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        transition: filter 120ms ease;
    }

    @media (hover: hover) {
        .menu-panel-close:hover {
            filter: brightness(1.2);
        }
    }

    .menu-panel-close-icon {
        display: block;
        width: 1.2rem;
        height: 1.2rem;
    }

    .menu-panel-outline {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        overflow: visible;
        pointer-events: none;
    }

    .menu-panel-scroll {
        position: relative;
        z-index: 1;
        max-height: calc(
            var(--panel-max-height) - 2.75rem - var(--menu-close-row)
        );
        padding-top: var(--menu-close-row);
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
        text-align: left;
        text-wrap: balance;
        hyphens: auto;
        -webkit-hyphens: auto;
    }

    .menu-intro :global(p) {
        margin: 0;
        font-size: 26px;
        line-height: 1.2;
        font-weight: 400;
        letter-spacing: var(--h3-letter-spacing);
        hyphens: inherit;
        -webkit-hyphens: inherit;
    }

    .menu-intro :global(p + p) {
        margin-top: 0.75rem;
    }

    .menu-content {
        hyphens: auto;
        -webkit-hyphens: auto;
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
        font-weight: 600;
        letter-spacing: var(--h5-letter-spacing);
        hyphens: inherit;
        -webkit-hyphens: inherit;
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
