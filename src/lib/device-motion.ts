import { browser } from "$app/environment";

type MotionEventConstructor = typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<PermissionState>;
};

type OrientationEventConstructor = typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<PermissionState>;
};

type SensorPermissionName = "accelerometer" | "gyroscope";

export type MotionSensorReadiness =
    | { status: "ready" }
    | { status: "prompt" }
    | { status: "unavailable"; reason: "unsupported" | "insecure" }
    | { status: "denied" };

export const isIOSDevice = (): boolean => {
    if (!browser) return false;

    const ua = navigator.userAgent;
    const isClassicIOS = /iPad|iPhone|iPod/.test(ua);
    const isIPadOS =
        navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

    return isClassicIOS || isIPadOS;
};

export const isTouchDevice = (): boolean => {
    if (!browser) return false;

    return (
        navigator.maxTouchPoints > 0 ||
        "ontouchstart" in window ||
        window.matchMedia("(pointer: coarse)").matches
    );
};

const getMotionEventCtor = (): MotionEventConstructor | undefined =>
    browser ? window.DeviceMotionEvent : undefined;

const getOrientationEventCtor = (): OrientationEventConstructor | undefined =>
    browser ? window.DeviceOrientationEvent : undefined;

export const motionSensorsSupported = (): boolean =>
    Boolean(getMotionEventCtor() && getOrientationEventCtor());

// Touch devices need an explicit user gesture before we attach sensors: iOS
// requires requestPermission(), and other mobile browsers only deliver reliable
// motion data after a clear user intent. Desktop has no sensors worth prompting
// for, so we never show the button there.
export const needsMotionPermission = (): boolean => {
    if (!motionSensorsSupported()) return false;
    return isTouchDevice() || isIOSDevice();
};

export const hasMotionPermissionApi = (): boolean => {
    const motionEvent = getMotionEventCtor();
    const orientationEvent = getOrientationEventCtor();
    return (
        typeof motionEvent?.requestPermission === "function" ||
        typeof orientationEvent?.requestPermission === "function"
    );
};

const querySensorPermission = async (
    name: SensorPermissionName,
): Promise<PermissionState | null> => {
    if (!browser || !navigator.permissions?.query) return null;

    try {
        const result = await navigator.permissions.query({
            name,
        } as unknown as PermissionDescriptor);
        return result.state;
    } catch {
        return null;
    }
};

export const getPreExistingMotionPermissionState = async (): Promise<
    "granted" | "denied" | "prompt" | "unknown"
> => {
    if (!browser) return "unknown";

    let sawPrompt = false;
    let sawDenied = false;
    let sawGranted = false;

    for (const name of ["accelerometer", "gyroscope"] as const) {
        const state = await querySensorPermission(name);
        if (state === "denied") sawDenied = true;
        else if (state === "granted") sawGranted = true;
        else if (state === "prompt") sawPrompt = true;
    }

    if (sawDenied) return "denied";
    if (sawGranted) return "granted";
    if (sawPrompt) return "prompt";
    return "unknown";
};

export const assessMotionSensorReadiness =
    async (): Promise<MotionSensorReadiness> => {
        if (!motionSensorsSupported()) {
            return { status: "unavailable", reason: "unsupported" };
        }

        if (!browser || !window.isSecureContext) {
            return { status: "unavailable", reason: "insecure" };
        }

        if (!needsMotionPermission()) {
            return { status: "ready" };
        }

        const permission = await getPreExistingMotionPermissionState();
        if (permission === "denied") return { status: "denied" };
        if (permission === "granted") return { status: "ready" };
        return { status: "prompt" };
    };

export const requestMotionSensorsAccess = async (): Promise<
    "granted" | "denied" | "unsupported"
> => {
    if (!motionSensorsSupported()) return "unsupported";

    const motionEvent = getMotionEventCtor();
    const orientationEvent = getOrientationEventCtor();
    if (!motionEvent || !orientationEvent) return "unsupported";

    try {
        if (typeof motionEvent.requestPermission === "function") {
            const motionResult = await motionEvent.requestPermission();
            if (motionResult !== "granted") return "denied";
        }

        if (typeof orientationEvent.requestPermission === "function") {
            const orientationResult =
                await orientationEvent.requestPermission();
            if (orientationResult !== "granted") return "denied";
        }

        return "granted";
    } catch {
        return "denied";
    }
};

export const verifyMotionSensorsDeliverData = (
    timeoutMs = 900,
): Promise<boolean> => {
    if (!browser || !motionSensorsSupported()) {
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        let settled = false;

        const finish = (ok: boolean) => {
            if (settled) return;
            settled = true;
            window.removeEventListener("devicemotion", onMotion);
            window.removeEventListener("deviceorientation", onOrientation);
            clearTimeout(timer);
            resolve(ok);
        };

        const onMotion = (event: DeviceMotionEvent) => {
            if (readMotionSample(event)) finish(true);
        };

        const onOrientation = (event: DeviceOrientationEvent) => {
            if (
                event.gamma !== null ||
                event.beta !== null ||
                event.alpha !== null
            ) {
                finish(true);
            }
        };

        window.addEventListener("devicemotion", onMotion, { passive: true });
        window.addEventListener("deviceorientation", onOrientation, {
            passive: true,
        });

        const timer = setTimeout(() => finish(false), timeoutMs);
    });
};

export type MotionSample = {
    x: number;
    y: number;
    z: number;
};

export const readMotionSample = (
    event: DeviceMotionEvent,
): MotionSample | null => {
    const acc = event.acceleration;
    if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        return { x: acc.x, y: acc.y, z: acc.z };
    }

    const incl = event.accelerationIncludingGravity;
    if (
        !incl ||
        incl.x === null ||
        incl.y === null ||
        incl.z === null
    ) {
        return null;
    }

    return { x: incl.x, y: incl.y, z: incl.z };
};

export const readRotationSample = (
    event: DeviceMotionEvent,
): MotionSample | null => {
    const rot = event.rotationRate;
    if (!rot || rot.alpha === null || rot.beta === null || rot.gamma === null) {
        return null;
    }

    return { x: rot.beta, y: rot.gamma, z: rot.alpha };
};
