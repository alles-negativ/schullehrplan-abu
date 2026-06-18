const FIXED_DT = 1000 / 60;
const MAX_FRAME_MS = 250;
const MAX_SUBSTEPS = 5;

export type MatterTimestepState = {
    lastTime: number;
    accumulator: number;
};

export function createMatterTimestepState(): MatterTimestepState {
    return { lastTime: 0, accumulator: 0 };
}

/** Run fixed 60 Hz physics steps from rAF timestamp, decoupled from display rate. */
export function stepMatterPhysics(
    step: (deltaMs: number) => void,
    time: number,
    state: MatterTimestepState,
): void {
    if (!state.lastTime) {
        state.lastTime = time;
        step(FIXED_DT);
        return;
    }

    const frameDelta = Math.min(time - state.lastTime, MAX_FRAME_MS);
    state.lastTime = time;
    state.accumulator += frameDelta;

    let steps = 0;
    while (state.accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
        step(FIXED_DT);
        state.accumulator -= FIXED_DT;
        steps++;
    }
}
