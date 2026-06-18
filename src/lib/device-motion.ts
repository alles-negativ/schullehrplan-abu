import { browser } from "$app/environment";

type MotionEventConstructor = typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<PermissionState>;
};

type OrientationEventConstructor = typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<PermissionState>;
};

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

export type MotionSample = {
    x: number;
    y: number;
    z: number;
};

export const readMotionSample = (
    event: DeviceMotionEvent,
): MotionSample | null => {
    const acc = event.acceleration;
    if (
        acc &&
        acc.x !== null &&
        acc.y !== null &&
        acc.z !== null
    ) {
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
