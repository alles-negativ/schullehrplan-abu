<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { getAllEducationModes } from "$lib/data/education-modes";
    import { tick } from "svelte";

    const SUBMENU_MOTION_MS = 220;

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
    let submenuMounted = $state(false);
    let submenuVisible = $state(false);
    let suppressSlideTransition = $state(false);
    let hideSubmenuTimeout: ReturnType<typeof setTimeout> | undefined;
    let lastSubmenuView = $state<
        "lehrplan" | "zirkularitaet" | "overview" | null
    >(null);

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
            return;
        }

        const containerRect = modeListElement.getBoundingClientRect();
        const buttonRect =
            modeButtonRefs[activeModeIndex].getBoundingClientRect();
        const buttonLeft = buttonRect.left - containerRect.left;
        const trackWidth =
            submenuTrackElement?.getBoundingClientRect().width ??
            buttonRect.width;
        submenuLeft = buttonLeft + (buttonRect.width - trackWidth) / 2;
        updateModeButtonWidthVar();
    };

    const revealSubmenu = async () => {
        if (hideSubmenuTimeout) {
            clearTimeout(hideSubmenuTimeout);
            hideSubmenuTimeout = undefined;
        }

        suppressSlideTransition = true;
        submenuVisible = false;
        submenuMounted = true;

        await tick();
        updateSubmenuPosition();

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                updateSubmenuPosition();
                requestAnimationFrame(() => resolve());
            });
        });

        submenuVisible = true;
        await tick();
        updateSubmenuPosition();
        setTimeout(() => {
            suppressSlideTransition = false;
        }, SUBMENU_MOTION_MS);
    };

    const hideSubmenu = () => {
        submenuVisible = false;
        hideSubmenuTimeout = setTimeout(() => {
            submenuMounted = false;
            hideSubmenuTimeout = undefined;
        }, SUBMENU_MOTION_MS);
    };

    $effect(() => {
        activeModeIndex;
        page.url.pathname;
        modeListElement;
        modeButtonRefs;
        submenuTrackElement;

        if (typeof window === "undefined") return;

        if (activeModeIndex < 0) {
            if (submenuMounted) {
                hideSubmenu();
            }
            return;
        }

        if (!submenuMounted) {
            revealSubmenu();
            return;
        }

        requestAnimationFrame(() => {
            updateSubmenuPosition();
        });
    });

    $effect(() => {
        if (typeof window === "undefined") return;
        const onResize = () => {
            updateSubmenuPosition();
            updateModeButtonWidthVar();
        };
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            if (hideSubmenuTimeout) {
                clearTimeout(hideSubmenuTimeout);
            }
        };
    });

    const getSearchParam = (key: string) =>
        browser ? page.url.searchParams.get(key) : null;

    const getModeHref = (slug: string) => getModePath(slug);
    const getViewPath = (view: "lehrplan" | "zirkularitaet") => {
        const params = browser
            ? new URLSearchParams(page.url.searchParams)
            : new URLSearchParams();
        if (view === "lehrplan") {
            params.delete("year");
            params.delete("topic");
            params.set("view", "lehrplan");
        } else {
            params.set("view", view);
            params.delete("year");
            params.delete("topic");
        }

        const query = params.toString();
        return `${page.url.pathname}${query ? `?${query}` : ""}`;
    };
    const getModeSubmenuView = ():
        | "lehrplan"
        | "zirkularitaet"
        | "overview" => {
        if (getSearchParam("view") === "zirkularitaet") return "zirkularitaet";
        if (
            !getSearchParam("view") &&
            !getSearchParam("year") &&
            !getSearchParam("topic")
        ) {
            return "overview";
        }
        return "lehrplan";
    };

    $effect.pre(() => {
        if (activeModeIndex >= 0) {
            page.url.searchParams;
            lastSubmenuView = getModeSubmenuView();
        }
    });

    const submenuView = $derived(
        activeModeIndex >= 0 ? getModeSubmenuView() : lastSubmenuView,
    );
</script>

<nav class="main-nav" aria-label="Ausbildungsmodi">
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
            {#if submenuMounted}
                <div
                    class="mode-submenu-track"
                    class:no-slide={suppressSlideTransition}
                    bind:this={submenuTrackElement}
                    style={`transform: translateX(${submenuLeft}px);`}
                >
                    <div
                        class="mode-submenu-panel"
                        class:is-visible={submenuVisible}
                    >
                        <ul class="mode-list-sub">
                            <li>
                                <a
                                    class="mode-sub-button"
                                    class:is-active={submenuView === "lehrplan"}
                                    href={getViewPath("lehrplan")}
                                    aria-current={submenuView === "lehrplan"
                                        ? "page"
                                        : undefined}
                                >
                                    Lehrplan
                                </a>
                            </li>
                            <li>
                                <a
                                    class="mode-sub-button"
                                    class:is-active={submenuView ===
                                        "zirkularitaet"}
                                    href={getViewPath("zirkularitaet")}
                                    aria-current={submenuView ===
                                    "zirkularitaet"
                                        ? "page"
                                        : undefined}
                                >
                                    Zirkularität
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</nav>

<style>
    .main-nav {
        position: relative;
        z-index: 4;
        /* Reserve space for the absolutely positioned submenu row */
        /* padding-bottom: 180px; */
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
        isolation: isolate;
    }

    .mode-list {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 10px;
        padding: 0;
        margin: 0;
        list-style: none;
        position: relative;
        z-index: 2;
        /* background: var(--color-background); */
    }

    .mode-list li {
        flex: 0 0 auto;
    }

    .mode-submenu-track {
        position: absolute;
        left: 0;
        top: calc(100% + 10px);
        z-index: 1;
        transition: transform 220ms ease-in-out;
    }

    .mode-submenu-track.no-slide {
        transition: none;
    }

    .mode-submenu-panel {
        opacity: 0;
        transform: translateY(-20px);
        pointer-events: none;
        transition:
            transform 220ms ease-in-out,
            opacity 220ms ease-in-out;
    }

    .mode-submenu-panel.is-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }

    .mode-list-sub {
        display: flex;
        justify-content: center;
        gap: 10px;
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
        max-height: 45px;
        padding: 5px 25px;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        font-size: var(--h3-size);
        line-height: var(--h3-line-height);
        font-weight: var(--h3-weight);
        letter-spacing: var(--h3-letter-spacing);
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
            transform 60ms ease,
            filter 60ms ease;
    }

    .mode-sub-button:hover,
    .mode-sub-button.is-active {
        background: var(--color-darkblue);
        color: var(--color-white);
    }
    .mode-sub-button.is-active:hover {
        filter: brightness(1.2);
    }

    .mode-button {
        display: inline-block;
        max-height: 55px;
        padding: 7px 25px;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        text-decoration: none;
        font-size: var(--h2-size);
        line-height: var(--h2-line-height);
        font-weight: var(--h2-weight);
        letter-spacing: var(--h2-letter-spacing);
        white-space: nowrap;
        text-align: center;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            transform 60ms ease,
            filter 60ms ease;
    }

    .mode-button--qv {
        padding-inline: 1.25rem;
    }

    .mode-button:hover,
    .mode-button.is-current {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .mode-button.is-current:hover {
        filter: brightness(1.2);
    }

    @media (prefers-reduced-motion: reduce) {
        .mode-submenu-track,
        .mode-submenu-panel,
        .mode-sub-button,
        .mode-button {
            transition: none;
        }

        .mode-submenu-panel.is-visible {
            opacity: 1;
            transform: none;
        }
    }
</style>
