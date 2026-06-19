export type MobileMotionStatus = {
    assessmentComplete: boolean;
    needsPermission: boolean;
    motionEnabled: boolean;
    permissionPending: boolean;
    permissionDenied: boolean;
    permissionDeclined: boolean;
    sensorsUnavailable: boolean;
};

export type MobileMotionControls = {
    enableMotion: () => Promise<void>;
    declineMotion: () => void;
};

export const createMobileMotionStatus = (): MobileMotionStatus => ({
    assessmentComplete: false,
    needsPermission: false,
    motionEnabled: false,
    permissionPending: false,
    permissionDenied: false,
    permissionDeclined: false,
    sensorsUnavailable: false,
});
