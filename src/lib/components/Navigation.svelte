<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import closeIcon from "$lib/assets/close-icon.svg";
    import { getAllEducationModes } from "$lib/data/education-modes";
    import { tick, untrack } from "svelte";
    import { fade } from "svelte/transition";

    const SUBMENU_MOTION_MS = 220;
    const NAV_HIDE_MS = 220;
    const SCROLL_DIRECTION_THRESHOLD = 2;
    const CONTRACTED_MEDIA = "(max-width: 1399px)";

    const educationModes = getAllEducationModes();
    const getModePath = (slug: string) => `/modes/${encodeURIComponent(slug)}`;
    const qvPath = "/qv?chapter=0";
    const isQvRoute = $derived(page.url.pathname === "/qv");
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
    let isContractedViewport = $state(
        browser ? window.matchMedia(CONTRACTED_MEDIA).matches : false,
    );
    let suppressMenuTransition = $state(false);
    let navMenuExpanded = $state(false);
    let navToggleElement = $state<HTMLButtonElement | null>(null);
    let modeListWrapElement = $state<HTMLDivElement | null>(null);
    let reducedMotion = $state(false);
    let navElement = $state<HTMLElement | null>(null);
    let navSpacerHeight = $state<number | null>(null);
    let navHideOffset = 0;
    let navTranslateY = $state(0);
    let navAnimating = $state(false);
    let navMode: "attached" | "floating" = "attached";
    let navHidden = $state(false);
    let lastScrollY = 0;

    const showContractedSubmenu = $derived(
        isContractedViewport && activeModeIndex >= 0,
    );

    const focusNavToggle = () => {
        navToggleElement?.focus();
    };

    const collapseNavMenu = async () => {
        if (!navMenuExpanded) return;
        navMenuExpanded = false;
        await tick();
        focusNavToggle();
    };

    const toggleNavMenu = () => {
        navMenuExpanded = !navMenuExpanded;
    };

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
            isContractedViewport ||
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

    const enterContractedViewport = () => {
        navMenuExpanded = false;
        suppressMenuTransition = true;

        if (hideSubmenuTimeout) {
            clearTimeout(hideSubmenuTimeout);
            hideSubmenuTimeout = undefined;
        }

        submenuVisible = false;
        submenuMounted = false;
        suppressSlideTransition = true;

        requestAnimationFrame(() => {
            suppressMenuTransition = false;
            suppressSlideTransition = false;
        });
    };

    const leaveContractedViewport = () => {
        navMenuExpanded = false;

        if (activeModeIndex < 0) {
            submenuVisible = false;
            submenuMounted = false;
            return;
        }

        if (hideSubmenuTimeout) {
            clearTimeout(hideSubmenuTimeout);
            hideSubmenuTimeout = undefined;
        }

        suppressSlideTransition = true;
        submenuMounted = true;
        submenuVisible = true;

        requestAnimationFrame(() => {
            updateSubmenuPosition();
            requestAnimationFrame(() => {
                updateSubmenuPosition();
                suppressSlideTransition = false;
            });
        });
    };

    const applyViewport = (matches: boolean) => {
        const wasContracted = isContractedViewport;
        if (matches === wasContracted) return;

        if (matches) {
            enterContractedViewport();
        }

        isContractedViewport = matches;

        if (!matches) {
            leaveContractedViewport();
        }
    };

    $effect(() => {
        if (!browser) return;

        const mq = window.matchMedia(CONTRACTED_MEDIA);
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        reducedMotion = motionQuery.matches;

        const syncViewport = () => applyViewport(mq.matches);
        const onMotionChange = (event: MediaQueryListEvent) => {
            reducedMotion = event.matches;
        };

        syncViewport();
        mq.addEventListener("change", syncViewport);
        motionQuery.addEventListener("change", onMotionChange);
        return () => {
            mq.removeEventListener("change", syncViewport);
            motionQuery.removeEventListener("change", onMotionChange);
        };
    });

    $effect(() => {
        if (!browser || !isContractedViewport || !navMenuExpanded) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (modeListWrapElement?.contains(target)) return;
            void collapseNavMenu();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () =>
            document.removeEventListener("pointerdown", handlePointerDown);
    });

    $effect(() => {
        activeModeIndex;
        page.url.pathname;
        modeListElement;
        modeButtonRefs;
        submenuTrackElement;
        isContractedViewport;

        if (typeof window === "undefined" || isContractedViewport) return;

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

    // Measures two things while the nav sits at its natural (translateY: 0)
    // resting spot: the spacer height that keeps page content below the fixed
    // nav, and the full reach to the bottom of the submenu, which is the
    // distance we translate upward to hide the nav completely.
    const measureNav = () => {
        if (!navElement) return;

        navSpacerHeight = navElement.offsetHeight;

        const navRect = navElement.getBoundingClientRect();
        let bottom = navRect.bottom;

        if (submenuTrackElement && submenuMounted) {
            bottom = Math.max(
                bottom,
                submenuTrackElement.getBoundingClientRect().bottom,
            );
        }

        // getBoundingClientRect already includes the current transform, so we
        // subtract it to recover the untranslated reach from the viewport top.
        navHideOffset = bottom - navTranslateY;
    };

    const applyNavScroll = () => {
        if (!browser) return;

        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY;
        lastScrollY = scrollY;

        if (navMenuExpanded) {
            navMode = "attached";
            navAnimating = false;
            navHidden = false;
            navTranslateY = 0;
            return;
        }

        if (navMode === "attached") {
            // At/near the top the nav rides along with the page (no animation),
            // exactly mirroring where it would sit in normal document flow.
            navAnimating = false;
            navHidden = false;

            if (navHideOffset > 0 && scrollY >= navHideOffset) {
                // Fully scrolled out of view: hand off to floating mode at the
                // identical offset, so the switch is visually seamless.
                navMode = "floating";
                navHidden = true;
                navTranslateY = -navHideOffset;
            } else {
                navTranslateY = -scrollY;
            }
            return;
        }

        // Floating mode: animate in on scroll up, out on scroll down.
        if (scrollY <= 0) {
            navMode = "attached";
            navAnimating = false;
            navHidden = false;
            navTranslateY = 0;
            return;
        }

        if (delta > SCROLL_DIRECTION_THRESHOLD && !navHidden) {
            navHidden = true;
            navAnimating = true;
            navTranslateY = -navHideOffset;
        } else if (delta < -SCROLL_DIRECTION_THRESHOLD && navHidden) {
            navHidden = false;
            navAnimating = true;
            navTranslateY = 0;
        }
    };

    $effect(() => {
        if (!browser) return;

        // Set up the scroll listener exactly once. The initial measure/apply
        // must be untracked, otherwise reading nav state here would make this
        // effect re-run on every scroll (re-measuring mid-animation and
        // corrupting the hide offset).
        untrack(() => {
            lastScrollY = window.scrollY;
            measureNav();
            applyNavScroll();
        });

        const onScroll = () => applyNavScroll();

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    });

    $effect(() => {
        if (!browser) return;

        submenuMounted;
        submenuVisible;
        navMenuExpanded;
        showContractedSubmenu;
        isContractedViewport;
        activeModeIndex;

        requestAnimationFrame(() => {
            measureNav();
            applyNavScroll();
        });
    });

    $effect(() => {
        if (typeof window === "undefined") return;
        const onResize = () => {
            applyViewport(window.matchMedia(CONTRACTED_MEDIA).matches);
            updateSubmenuPosition();
            updateModeButtonWidthVar();
            measureNav();
            applyNavScroll();
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

{#snippet submenuLinks(onNavigate?: () => void)}
    <li>
        <a
            class="mode-sub-button"
            class:is-active={submenuView === "lehrplan"}
            href={getViewPath("lehrplan")}
            aria-current={submenuView === "lehrplan" ? "page" : undefined}
            onclick={onNavigate}
        >
            Lehrplan
        </a>
    </li>
    <li>
        <a
            class="mode-sub-button"
            class:is-active={submenuView === "zirkularitaet"}
            href={getViewPath("zirkularitaet")}
            aria-current={submenuView === "zirkularitaet" ? "page" : undefined}
            onclick={onNavigate}
        >
            Zirkularität
        </a>
    </li>
{/snippet}

<div
    class="nav-anchor"
    style:height={navSpacerHeight != null ? `${navSpacerHeight}px` : undefined}
>
    <nav
        class="main-nav"
        class:is-animating={navAnimating}
        class:is-hidden={navHidden}
        bind:this={navElement}
        style={`--nav-hide-ms: ${reducedMotion ? 0 : NAV_HIDE_MS}ms; transform: translateY(${navTranslateY}px);`}
        aria-label="Ausbildungsmodi"
        aria-hidden={navHidden ? true : undefined}
    >
        <div class="nav-top">
            <a
                class="mode-button nav-home"
                href="/"
                onclick={(e) => {
                    if (page.url.pathname === "/") {
                        e.preventDefault();
                        location.reload();
                    }
                    collapseNavMenu();
                }}>Schullehrplan ABU</a
            >
            <div
                class="mode-list-wrap"
                class:is-contracted={isContractedViewport}
                class:is-expanded={navMenuExpanded}
                bind:this={modeListWrapElement}
            >
                {#if showContractedSubmenu}
                    <ul
                        class="mode-list-sub mode-list-sub--contracted"
                        in:fade={{
                            duration: reducedMotion ? 0 : SUBMENU_MOTION_MS,
                        }}
                    >
                        {@render submenuLinks()}
                    </ul>
                {/if}

                <div class="nav-dropdown-anchor">
                    {#if isContractedViewport}
                        <button
                            type="button"
                            class="nav-toggle"
                            class:is-active={navMenuExpanded}
                            bind:this={navToggleElement}
                            aria-expanded={navMenuExpanded}
                            aria-controls="nav-mode-list"
                            aria-label={navMenuExpanded
                                ? "Navigation schliessen"
                                : "Navigation öffnen"}
                            onclick={toggleNavMenu}
                        >
                            <img
                                src={closeIcon}
                                alt=""
                                class="nav-toggle-icon"
                                class:is-plus={!navMenuExpanded}
                            />
                        </button>
                    {/if}

                    <div
                        class="mode-menu"
                        class:is-open={navMenuExpanded}
                        class:no-transition={suppressMenuTransition}
                        inert={isContractedViewport && !navMenuExpanded}
                    >
                        <ul
                            id="nav-mode-list"
                            class="mode-list"
                            bind:this={modeListElement}
                        >
                            {#each educationModes as mode, index}
                                <li>
                                    <a
                                        class="mode-button"
                                        class:is-current={activeModeIndex ===
                                            index}
                                        href={getModeHref(mode.slug)}
                                        aria-current={page.url.pathname ===
                                        getModePath(mode.slug)
                                            ? "page"
                                            : undefined}
                                        bind:this={modeButtonRefs[index]}
                                        onclick={isContractedViewport
                                            ? collapseNavMenu
                                            : undefined}
                                    >
                                        {mode.title}
                                    </a>
                                </li>
                            {/each}
                            <li class="mode-qv-item">
                                <a
                                    class="mode-button mode-button--qv"
                                    class:is-current={isQvRoute}
                                    href={qvPath}
                                    aria-current={isQvRoute
                                        ? "page"
                                        : undefined}
                                    onclick={isContractedViewport
                                        ? collapseNavMenu
                                        : undefined}
                                >
                                    QV
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {#if !isContractedViewport && submenuMounted}
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
                                {@render submenuLinks()}
                            </ul>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </nav>
</div>

<style>
    :root {
        --z-main-navigation: 2147483647;
    }

    .nav-anchor {
        position: relative;
        z-index: var(--z-main-navigation);
    }

    .main-nav {
        position: fixed;
        top: calc(30 * var(--u));
        left: calc(30 * var(--u));
        right: calc(30 * var(--u));
        z-index: var(--z-main-navigation);
        padding-bottom: calc(10 * var(--u));
        background: none;
        will-change: transform;
    }

    .main-nav.is-animating {
        transition: transform var(--nav-hide-ms, 220ms) ease-in-out;
    }

    .main-nav.is-hidden {
        pointer-events: none;
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

    @media (max-width: 1399px) {
        .mode-list-wrap {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: calc(10 * var(--u));
            --contracted-nav-control-height: calc(55 * var(--u));
        }

        .nav-dropdown-anchor {
            display: flex;
            align-items: center;
        }

        .mode-list-sub--contracted li {
            display: flex;
            align-items: center;
        }

        .nav-toggle {
            width: var(--contracted-nav-control-height);
            height: var(--contracted-nav-control-height);
        }
    }

    .nav-dropdown-anchor {
        position: relative;
        flex-shrink: 0;
    }

    .mode-menu {
        position: relative;
    }

    @media (min-width: 1400px) {
        .mode-menu {
            position: relative;
            opacity: 1;
            visibility: visible;
            transform: none;
            pointer-events: auto;
            display: block;
        }

        .mode-list-sub--contracted {
            display: none;
        }
    }

    @media (max-width: 1399px) {
        .mode-submenu-track {
            display: none;
        }

        .nav-toggle {
            display: inline-grid;
        }

        .mode-menu {
            display: none;
            position: absolute;
            top: calc(100% + calc(10 * var(--u)));
            right: 0;
            left: auto;
            z-index: 5;
            width: max-content;
            opacity: 0;
            visibility: hidden;
            transform: translateY(calc(-10 * var(--u)));
            pointer-events: none;
            transition:
                opacity 220ms ease-in-out,
                transform 220ms ease-in-out,
                visibility 0ms linear 220ms;
        }

        .mode-menu.is-open {
            display: block;
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            pointer-events: auto;
            transition:
                opacity 220ms ease-in-out,
                transform 220ms ease-in-out,
                visibility 0ms linear 0ms;
        }

        .mode-menu.no-transition,
        .mode-menu.no-transition.is-open {
            transition: none;
        }
    }

    @media (max-width: 1399px) {
        .mode-list-wrap .mode-list {
            flex-direction: column;
            align-items: flex-end;
            gap: calc(10 * var(--u));
            width: max-content;
            padding: 0;
            background: transparent;
            box-shadow: none;
        }

        .mode-list-wrap .mode-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: auto;
            height: var(--contracted-nav-control-height, calc(55 * var(--u)));
            max-height: none;
            padding-block: 0;
            padding-inline: calc(25 * var(--u));
            line-height: 1;
        }

        .mode-list-wrap .mode-list-sub--contracted .mode-sub-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: var(--contracted-nav-control-height, calc(55 * var(--u)));
            max-height: none;
            padding-block: 0;
            padding-inline: calc(25 * var(--u));
            font-size: calc(32 * var(--u));
            line-height: 1;
            font-weight: 300;
            letter-spacing: 0.01em;
        }
    }

    .mode-list-sub--contracted {
        margin-inline: 0;
        flex-shrink: 0;
        align-items: center;
    }

    .mode-list {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: calc(10 * var(--u));
        padding: 0;
        margin: 0;
        list-style: none;
        position: relative;
        z-index: 2;
    }

    .mode-list li {
        flex: 0 0 auto;
    }

    .mode-submenu-track {
        position: absolute;
        left: 0;
        top: calc(100% + calc(10 * var(--u)));
        z-index: 1;
        transition: transform 220ms ease-in-out;
    }

    .mode-submenu-track.no-slide {
        transition: none;
    }

    .mode-submenu-panel {
        opacity: 0;
        transform: translateY(calc(-20 * var(--u)));
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
        gap: calc(10 * var(--u));
        padding: 0;
        margin: 0;
        list-style: none;
        width: max-content;
        margin-inline: auto;
    }

    .mode-list-sub li {
        flex: 0 0 auto;
    }

    .nav-toggle {
        flex-shrink: 0;
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        width: calc(52 * var(--u));
        height: calc(52 * var(--u));
        place-items: center;
        background: var(--color-white);
        padding: 0;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            filter 120ms ease;
    }

    .nav-toggle:hover,
    .nav-toggle.is-active {
        background: var(--color-darkblue);
    }

    .nav-toggle.is-active:hover {
        filter: brightness(1.2);
    }

    .nav-toggle-icon {
        width: calc(22 * var(--u));
        height: calc(22 * var(--u));
        display: block;
        filter: brightness(0);
        transition:
            transform 220ms ease-in-out,
            filter 120ms ease;
    }

    .nav-toggle:hover .nav-toggle-icon,
    .nav-toggle.is-active .nav-toggle-icon {
        filter: none;
    }

    .nav-toggle-icon.is-plus {
        transform: rotate(45deg);
    }

    .mode-sub-button {
        display: inline-block;
        width: auto;
        box-sizing: border-box;
        max-height: calc(45 * var(--u));
        padding: calc(5 * var(--u)) calc(25 * var(--u));
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        font-size: calc(23 * var(--u));
        line-height: calc(31 * var(--u));
        font-weight: 400;
        letter-spacing: 0.01em;
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
        max-height: calc(55 * var(--u));
        padding: calc(7 * var(--u)) calc(25 * var(--u));
        border: calc(1.5 * var(--u)) solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        text-decoration: none;
        font-size: calc(32 * var(--u));
        line-height: calc(40 * var(--u));
        font-weight: 400;
        letter-spacing: 0.01em;
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
        padding-inline: calc(40 * var(--u));
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
        .main-nav {
            --nav-hide-ms: 0ms;
        }

        .mode-submenu-track,
        .mode-submenu-panel,
        .mode-menu,
        .mode-sub-button,
        .mode-button,
        .nav-toggle-icon {
            transition: none;
        }

        .mode-submenu-panel.is-visible,
        .mode-menu.is-open {
            opacity: 1;
            transform: none;
            visibility: visible;
        }
    }
</style>
