// name: device_fingerprint_spoof
// description: Spoofs device fingerprint, model, manufacturer, serial, bootloader status, and emulator detection.
// author: Bret McDanel
// version: 2.0
// tags: android, spoofing, fingerprint, emulator, privacy
// classes: android.os.Build, android.os.SystemProperties, java.lang.reflect.Method
// args:
// - key: deviceFingerprint
//   type: object
//   description: Device fingerprint spoof config.
//   example: {
//     "deviceFingerprint": {
//       "fingerprint": "custom/fingerprint/string",
//       "model": "Pixel 9",
//       "manufacturer": "Google",
//       "serial": "ABC123XYZ",
//       "bootVerified": "green",
//       "emulator": false
//     }
//   }

function hookDeviceFingerprintSpoof() {
    const spoof = globalThis.FridaConfig?.deviceFingerprint;
    if (!spoof || typeof spoof !== "object") return;

    const Build = use("android.os.Build");
    if (spoof.fingerprint) Build.FINGERPRINT.value = spoof.fingerprint;
    if (spoof.model) Build.MODEL.value = spoof.model;
    if (spoof.manufacturer) Build.MANUFACTURER.value = spoof.manufacturer;
    if (spoof.serial) Build.SERIAL.value = spoof.serial;

    const SystemProperties = use("android.os.SystemProperties");
    SystemProperties.get.overload('java.lang.String').implementation = function (key) {
        if (key === "ro.boot.verifiedbootstate" && spoof.bootVerified) return spoof.bootVerified;
        if (spoof.emulator === false && key.includes("ro.kernel.qemu")) return "0";
        return this.get(key);
    };

    const Method = use("java.lang.reflect.Method");
    Method.invoke.implementation = function (receiver, args) {
        const name = this.getName();
        const declaring = this.getDeclaringClass().getName();
        if (declaring.includes("Build")) {
            if (name === "getSerial" && spoof.serial) return spoof.serial;
        }
        return this.invoke(receiver, args);
    };
}

registerHook("device_fingerprint_spoof", hookDeviceFingerprintSpoof);
