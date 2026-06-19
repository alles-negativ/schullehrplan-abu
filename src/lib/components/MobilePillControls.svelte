<script lang="ts">
    import closeIcon from "$lib/assets/close-icon.svg";

    let {
        canRemove = false,
        onAdd,
        onRemove,
    }: {
        canRemove?: boolean;
        onAdd: () => void;
        onRemove: () => void;
    } = $props();
</script>

<div class="mobile-pill-controls">
    <button
        type="button"
        class="round-button"
        aria-label="Kompetenz hinzufügen"
        onclick={onAdd}
    >
        <img src={closeIcon} alt="" class="round-button-icon round-button-icon--plus" />
    </button>
    <button
        type="button"
        class="round-button"
        aria-label="Kompetenz entfernen"
        disabled={!canRemove}
        onclick={onRemove}
    >
        <span class="round-button-icon round-button-icon--minus" aria-hidden="true"></span>
    </button>
</div>

<style>
    .mobile-pill-controls {
        position: absolute;
        top: 1rem;
        left: 1rem;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }

    .round-button {
        display: inline-grid;
        flex-shrink: 0;
        place-items: center;
        width: 2.75rem;
        height: 2.75rem;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        padding: 0;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            filter 120ms ease;
    }

    .round-button:hover:not(:disabled) {
        background: var(--color-darkblue);
    }

    .round-button:hover:not(:disabled) .round-button-icon--minus {
        background: var(--color-white);
    }

    .round-button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .round-button-icon {
        display: block;
        transition: filter 120ms ease;
    }

    .round-button-icon--plus {
        width: 1.1rem;
        height: 1.1rem;
        transform: rotate(45deg);
        filter: brightness(0);
    }

    .round-button:hover:not(:disabled) .round-button-icon--plus {
        filter: none;
    }

    .round-button-icon--minus {
        width: 1.1rem;
        height: 2px;
        border-radius: 1px;
        background: var(--color-black);
    }

    @media (prefers-reduced-motion: reduce) {
        .round-button,
        .round-button-icon {
            transition: none;
        }
    }
</style>
