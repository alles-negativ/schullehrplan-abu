export type MobileMotionStatus = {
    assessmentComplete: boolean;
    needsPermission: boolean;
    motionEnabled: boolean;
    permissionPending: boolean;
    permissionDenied: boolean;
    sensorsUnavailable: boolean;
};

export type MobileMotionControls = {
    enableMotion: () => Promise<void>;
};

export const createMobileMotionStatus = (): MobileMotionStatus => ({
    assessmentComplete: false,
    needsPermission: false,
    motionEnabled: false,
    permissionPending: false,
    permissionDenied: false,
    sensorsUnavailable: false,
});
