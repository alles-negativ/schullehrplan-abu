<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { getAllEducationModes } from "$lib/data/education-modes";

    const educationModes = getAllEducationModes();
    const getModePath = (slug: string) => `/modes/${encodeURIComponent(slug)}`;
    const qvPath = "/qv";
    const activeModeIndex = $derived(
        educationModes.findIndex(
            (mode) => page.url.pathname === getModePath(mode.slug),
        ),
    );

    let modeListElement = $state<HTMLUListElement | null>(null);
    let modeButtonRefs = $state<(HTMLAnchorElement | null)[]>([]);
    let submenuTrackElement = $state<HTMLDivElement | null>(null);
    let submenuLeft = $state(0);
    let submenuReady = $state(false);
    let suppressSlideTransition = $state(false);

    const updateModeButtonWidthVar = () => {
        if (typeof document === "undefined") return;
        const modeButton = modeButtonRefs.find(Boolean);
        if (!modeButton) return;
        document.documentElement.style.setProperty(
            "--mode-button-width",
            `${modeButton.getBoundingClientRect().width}px`,
        );
    };

    const updateSubmenuPosition = () => {
        if (
            activeModeIndex < 0 ||
            !modeListElement ||
            !modeButtonRefs[activeModeIndex]
        ) {
            submenuReady = false;
            return;
        }

        const containerRect = modeListElement.getBoundingClientRect();
        const buttonRect =
            modeButtonRefs[activeModeIndex].getBoundingClientRect();
        const isBecomingVisible = !submenuReady;

        if (isBecomingVisible) {
            suppressSlideTransition = true;
        }
        const buttonLeft = buttonRect.left - containerRect.left;
        const trackWidth =
            submenuTrackElement?.getBoundingClientRect().width ??
            buttonRect.width;
        submenuLeft = buttonLeft + (buttonRect.width - trackWidth) / 2;
        submenuReady = true;
        updateModeButtonWidthVar();

        if (isBecomingVisible && typeof window !== "undefined") {
            requestAnimationFrame(() => {
                updateSubmenuPosition();
                suppressSlideTransition = false;
            });
        }
    };

    $effect(() => {
        activeModeIndex;
        page.url.pathname;
        modeListElement;
        modeButtonRefs;
        submenuTrackElement;

        if (typeof window === "undefined") return;
        requestAnimationFrame(() => {
            updateSubmenuPosition();
            updateModeButtonWidthVar();
        });
    });

    $effect(() => {
        if (typeof window === "undefined") return;
        const onResize = () => {
            updateSubmenuPosition();
            updateModeButtonWidthVar();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    });

    const getModeHref = (slug: string) => {
        const modePath = getModePath(slug);
        const view = browser ? page.url.searchParams.get("view") : null;
        if (view === "zirkularitaet") {
            return `${modePath}?view=zirkularitaet`;
        }
        return modePath;
    };
    const getViewPath = (view: "lehrplan" | "zirkularitaet") => {
        const params = browser
            ? new URLSearchParams(page.url.searchParams)
            : new URLSearchParams();
        if (view === "lehrplan") {
            params.delete("view");
        } else {
            params.set("view", view);
        }

        const query = params.toString();
        return `${page.url.pathname}${query ? `?${query}` : ""}`;
    };
    const currentView = $derived(
        browser && page.url.searchParams.get("view") === "zirkularitaet"
            ? "zirkularitaet"
            : "lehrplan",
    );
</script>

<nav
    class="main-nav"
    class:has-submenu={activeModeIndex >= 0}
    aria-label="Ausbildungsmodi"
>
    <div class="nav-top">
        <a class="mode-button nav-home" href="/">Schullehrplan ABU</a>
        <div class="mode-list-wrap">
            <ul class="mode-list" bind:this={modeListElement}>
                {#each educationModes as mode, index}
                    <li>
                        <a
                            class="mode-button"
                            class:is-current={activeModeIndex === index}
                            href={getModeHref(mode.slug)}
                            aria-current={page.url.pathname ===
                            getModePath(mode.slug)
                                ? "page"
                                : undefined}
                            bind:this={modeButtonRefs[index]}
                        >
                            {mode.title}
                        </a>
                    </li>
                {/each}
                <li class="mode-qv-item">
                    <a
                        class="mode-button mode-button--qv"
                        class:is-current={page.url.pathname === qvPath}
                        href={qvPath}
                        aria-current={page.url.pathname === qvPath
                            ? "page"
                            : undefined}
                    >
                        QV
                    </a>
                </li>
            </ul>
            {#if activeModeIndex >= 0}
                <div
                    class="mode-submenu-track"
                    class:no-slide={suppressSlideTransition}
                    bind:this={submenuTrackElement}
                    style={`transform: translateX(${submenuLeft}px); opacity: ${submenuReady ? 1 : 0};`}
                >
                    <ul class="mode-list-sub">
                        <li>
                            <a
                                class="mode-sub-button"
                                class:is-active={currentView === "lehrplan"}
                                href={getViewPath("lehrplan")}
                                aria-current={currentView === "lehrplan"
                                    ? "page"
                                    : undefined}
                            >
                                Lehrplan
                            </a>
                        </li>
                        <li>
                            <a
                                class="mode-sub-button"
                                class:is-active={currentView ===
                                    "zirkularitaet"}
                                href={getViewPath("zirkularitaet")}
                                aria-current={currentView === "zirkularitaet"
                                    ? "page"
                                    : undefined}
                            >
                                Zirkularität
                            </a>
                        </li>
                    </ul>
                </div>
            {/if}
        </div>
    </div>
</nav>

<style>
    .main-nav {
        /* background: #f4f4f5; */
        padding: 0.75rem 1rem 1rem;
    }

    .main-nav.has-submenu {
        padding-bottom: 2.75rem;
    }

    .nav-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .nav-home {
        flex-shrink: 0;
    }

    .mode-list-wrap {
        position: relative;
        flex-shrink: 0;
    }

    .mode-list {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 0.5rem;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    .mode-list li {
        flex: 0 0 auto;
    }

    .mode-submenu-track {
        position: absolute;
        left: 0;
        top: calc(100% + 0.5rem);
        transition:
            transform 220ms ease,
            opacity 140ms ease;
    }

    .mode-submenu-track.no-slide {
        transition: opacity 140ms ease;
    }

    .mode-list-sub {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        padding: 0;
        margin: 0;
        list-style: none;
        width: max-content;
        margin-inline: auto;
    }

    .mode-list-sub li {
        flex: 0 0 auto;
    }

    .mode-sub-button {
        display: inline-block;
        width: auto;
        box-sizing: border-box;
        padding: 0.4rem 1.1rem;
        border: 1px solid #000000;
        border-radius: 9999px;
        background: #ffffff;
        color: #000000;
        font-size: 0.875rem;
        font-weight: 400;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        text-decoration: none;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            transform 60ms ease;
    }

    .mode-sub-button:hover {
        background: #fafafa;
    }

    .mode-sub-button:active {
        background: #f0f0f0;
        transform: translateY(1px);
    }

    .mode-sub-button:focus-visible {
        outline: 2px solid #000000;
        outline-offset: 2px;
    }

    .mode-sub-button.is-active {
        background: #000000;
        border-color: transparent;
        color: #ffffff;
    }

    .mode-sub-button.is-active:hover,
    .mode-sub-button.is-active:active {
        background: #000000;
        border-color: transparent;
        color: #ffffff;
    }

    .mode-button {
        display: inline-block;
        padding: 0.5rem 1.25rem;
        border: 1px solid #000000;
        border-radius: 9999px;
        background: #ffffff;
        color: #000000;
        text-decoration: none;
        font-weight: 400;
        white-space: nowrap;
        line-height: 1.2;
        text-align: center;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            transform 60ms ease;
    }

    .mode-button--qv {
        padding-inline: 1.25rem;
    }

    .mode-button:hover {
        background: #fafafa;
    }

    .mode-button:active {
        background: #f0f0f0;
        transform: translateY(1px);
    }

    .mode-button:focus-visible {
        outline: 2px solid #000000;
        outline-offset: 2px;
    }

    .mode-button.is-current {
        background: #000000;
        border-color: transparent;
        color: #ffffff;
    }

    .mode-button.is-current:hover,
    .mode-button.is-current:active {
        background: #000000;
        border-color: transparent;
        color: #ffffff;
    }

    .mode-button.is-current:focus-visible {
        outline-color: #000000;
    }

    @media (prefers-reduced-motion: reduce) {
        .mode-submenu-track,
        .mode-sub-button,
        .mode-button {
            transition: none;
        }
    }
</style>
