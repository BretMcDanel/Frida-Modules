// name: sift
// version: 1.1
// description: Hooks all major Sift SDK methods including config builder, user/session/device IDs, and payloads.
// author: Bret McDanel
// tags: android, sdk, telemetry, fraud, fingerprinting
// classes: siftscience.android.Sift, siftscience.android.Sift$Config$Builder

function hookSift() {
    const Sift = use("siftscience.android.Sift");
    if (!Sift) return;

    Sift.collect.implementation = function () {
        console.log("[Sift] collect() called");
        return this.collect();
    };

    Sift.setUserId.implementation = function (userId) {
        console.log("[Sift] setUserId:", userId);
        return this.setUserId(userId);
    };

    Sift.getUserId.implementation = function () {
        const uid = this.getUserId();
        console.log("[Sift] getUserId = ", uid);
        return uid;
    };

    Sift.unsetUserId.implementation = function () {
        console.log("[Sift] unsetUserId() called");
        return this.unsetUserId();
    };

    Sift.setDeviceId.implementation = function (deviceId) {
        console.log("[Sift] setDeviceId:", deviceId);
        return this.setDeviceId(deviceId);
    };

    Sift.getDeviceId.implementation = function () {
        const did = this.getDeviceId();
        console.log("[Sift] getDeviceId = ", did);
        return did;
    };

    Sift.setSessionId.implementation = function (sessionId) {
        console.log("[Sift] setSessionId:", sessionId);
        return this.setSessionId(sessionId);
    };

    Sift.getSessionId.implementation = function () {
        const sid = this.getSessionId();
        console.log("[Sift] getSessionId = ", sid);
        return sid;
    };

    Sift.setPayload.implementation = function (payload) {
        console.log("[Sift] setPayload:", payload);
        return this.setPayload(payload);
    };

    Sift.getPayload.implementation = function () {
        const payload = this.getPayload();
        console.log("[Sift] getPayload = ", payload);
        return payload;
    };

    Sift.open.implementation = function () {
        console.log("[Sift] open() called");
        return this.open();
    };

    Sift.close.implementation = function () {
        console.log("[Sift] close() called");
        return this.close();
    };
}

function hookSiftConfigBuilder() {
    const Builder = use("siftscience.android.Sift$Config$Builder");
    if (!Builder) return;

    Builder.withAccountId.implementation = function (accountId) {
        console.log("[Sift.Config] withAccountId:", accountId);
        return this.withAccountId(accountId);
    };

    Builder.withBeaconKey.implementation = function (beaconKey) {
        console.log("[Sift.Config] withBeaconKey:", beaconKey);
        return this.withBeaconKey(beaconKey);
    };

    Builder.withServerUrl.implementation = function (url) {
        console.log("[Sift.Config] withServerUrl:", url);
        return this.withServerUrl(url);
    };

    Builder.withDisallowLocationCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowLocationCollection:", flag);
        return this.withDisallowLocationCollection(flag);
    };

    Builder.withDisallowBatteryStateCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowBatteryStateCollection:", flag);
        return this.withDisallowBatteryStateCollection(flag);
    };

    Builder.withDisallowBluetoothCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowBluetoothCollection:", flag);
        return this.withDisallowBluetoothCollection(flag);
    };

    Builder.withDisallowMotionSensorCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowMotionSensorCollection:", flag);
        return this.withDisallowMotionSensorCollection(flag);
    };

    Builder.withDisallowPhoneStateCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowPhoneStateCollection:", flag);
        return this.withDisallowPhoneStateCollection(flag);
    };

    Builder.withDisallowSensorCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowSensorCollection:", flag);
        return this.withDisallowSensorCollection(flag);
    };

    Builder.withDisallowAppStateCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowAppStateCollection:", flag);
        return this.withDisallowAppStateCollection(flag);
    };

    Builder.withDisallowInstalledAppInfoCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowInstalledAppInfoCollection:", flag);
        return this.withDisallowInstalledAppInfoCollection(flag);
    };

    Builder.withDisallowDeviceFingerprintCollection.implementation = function (flag) {
        console.log("[Sift.Config] withDisallowDeviceFingerprintCollection:", flag);
        return this.withDisallowDeviceFingerprintCollection(flag);
    };

    Builder.build.implementation = function () {
        console.log("[Sift.Config] build() called");
        return this.build();
    };
}

registerHook("sift", hookSift);
registerHook("siftConfigBuilder", hookSiftConfigBuilder);