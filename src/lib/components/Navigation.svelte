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
    const isOverview = $derived(
        activeModeIndex >= 0 &&
            !getSearchParam("view") &&
            !getSearchParam("year") &&
            !getSearchParam("topic"),
    );
    const currentView = $derived(
        getSearchParam("view") === "zirkularitaet"
            ? "zirkularitaet"
            : isOverview
              ? "overview"
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
    .main-nav.has-submenu {
        padding-bottom: 180px;
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
        gap: 10px;
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
        top: calc(100% + 10px);
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
        .mode-sub-button,
        .mode-button {
            transition: none;
        }
    }
</style>
