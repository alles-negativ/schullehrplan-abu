<script lang="ts">
    import { page } from "$app/state";
    import { getAllEducationModes } from "$lib/data/education-modes";

    const educationModes = getAllEducationModes();
    const getModePath = (slug: string) => `/modes/${encodeURIComponent(slug)}`;
</script>

<nav aria-label="Ausbildungsmodi">
    <a class="mode-button" href="/">Schullehrplan ABU</a>
    <ul class="mode-list">
        {#each educationModes as mode}
            <li>
                <a
                    class="mode-button"
                    class:is-current={page.url.pathname ===
                        getModePath(mode.slug)}
                    href={getModePath(mode.slug)}
                    aria-current={page.url.pathname === getModePath(mode.slug)
                        ? "page"
                        : undefined}
                >
                    {mode.title}
                </a>
            </li>
        {/each}
    </ul>
</nav>

<style>
    .mode-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0;
        margin: 0;
        list-style: none;
        width: 100%;
        margin-top: 10px;
    }

    .mode-list li {
        flex: 1 1 12rem;
    }

    .mode-button {
        display: block;
        padding: 0.5rem 0.875rem;
        border: 1px solid #cfd4dc;
        border-radius: 9999px;
        background: #f6f8fb;
        color: #1f2937;
        text-decoration: none;
        font-weight: 600;
        line-height: 1.2;
        text-align: center;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            transform 60ms ease;
    }

    .mode-button:hover {
        background: #eaf0ff;
        border-color: #8fb0ff;
        color: #111827;
    }

    .mode-button:active {
        background: #dce7ff;
        border-color: #6f95ff;
        transform: translateY(1px);
    }

    .mode-button:focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
    }

    .mode-button.is-current {
        background: #2563eb;
        border-color: #1d4ed8;
        color: #ffffff;
    }

    .mode-button.is-current:hover,
    .mode-button.is-current:active {
        background: #1d4ed8;
        border-color: #1e40af;
        color: #ffffff;
    }

    .mode-button.is-current:focus-visible {
        outline-color: #1e40af;
    }
</style>
