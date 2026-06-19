<script lang="ts">
    import { fade } from "svelte/transition";
    import type { MobileMotionStatus } from "$lib/mobile-motion-status";

    let {
        motionStatus,
        onAccept,
        onDecline,
    }: {
        motionStatus: MobileMotionStatus;
        onAccept: () => void | Promise<void>;
        onDecline: () => void;
    } = $props();

    const showModal = $derived(
        motionStatus.assessmentComplete &&
            motionStatus.needsPermission &&
            !motionStatus.motionEnabled &&
            !motionStatus.permissionDenied &&
            !motionStatus.permissionDeclined,
    );
</script>

{#if showModal}
    <div
        class="modal-backdrop"
        transition:fade={{ duration: 180 }}
        aria-hidden="true"
    ></div>

    <div
        class="modal-wrap"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-sensor-modal-title"
        transition:fade={{ duration: 180 }}
    >
        <div class="modal-card">
            <p id="mobile-sensor-modal-title" class="modal-title">
                Sensoren verwenden
            </p>
            <div class="modal-actions">
                <button
                    type="button"
                    class="modal-button"
                    disabled={motionStatus.permissionPending}
                    onclick={() => void onAccept()}
                >
                    {motionStatus.permissionPending ? "…" : "Ja"}
                </button>
                <button
                    type="button"
                    class="modal-button"
                    disabled={motionStatus.permissionPending}
                    onclick={onDecline}
                >
                    Nein
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 19;
        background: rgba(240, 244, 246, 0.72);
        pointer-events: auto;
    }

    .modal-wrap {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        pointer-events: none;
    }

    .modal-card {
        box-sizing: border-box;
        width: min(100%, 18rem);
        padding: 1.5rem;
        border: 1.5px solid var(--color-black);
        border-radius: 1rem;
        background: var(--color-white);
        text-align: center;
        pointer-events: auto;
    }

    .modal-title {
        margin: 0;
        font-size: 1.125rem;
        line-height: 1.4;
        font-weight: 300;
        letter-spacing: 0.01em;
        text-wrap: balance;
    }

    .modal-actions {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 1.25rem;
    }

    .modal-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 4.5rem;
        min-height: 2.75rem;
        padding: 0.4375rem 1.5625rem;
        border: 1.5px solid var(--color-black);
        border-radius: 9999px;
        background: var(--color-white);
        color: var(--color-black);
        font: inherit;
        font-size: 1rem;
        line-height: 1.25;
        font-weight: 300;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            color 120ms ease,
            filter 120ms ease;
    }

    .modal-button:hover:not(:disabled) {
        background: var(--color-darkblue);
        color: var(--color-white);
    }

    .modal-button:disabled {
        opacity: 0.6;
        cursor: wait;
    }

    @media (prefers-reduced-motion: reduce) {
        .modal-button {
            transition: none;
        }
    }
</style>
