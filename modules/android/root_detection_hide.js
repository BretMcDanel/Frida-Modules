// name: root_detection_hide
// description: Hides root detection flags including su binary, known paths, and system properties.
// author: Bret McDanel
// version: 2.0
// tags: android, root, hiding, privacy
// classes: java.io.File, android.os.SystemProperties
// args:
// - key: hideRoot
//   type: boolean
//   description: Toggle to hide root indicators.
//   example: { "hideRoot": true }

function hookRootDetectionHide() {
    if (!globalThis.FridaConfig?.hideRoot) return;

    const File = use("java.io.File");
    File.exists.implementation = function () {
        const path = this.getAbsolutePath();
        if (path.includes("/su") || path.includes("magisk") || path.includes("/xposed")) return false;
        return this.exists();
    };

    const SystemProperties = use("android.os.SystemProperties");
    SystemProperties.get.overload('java.lang.String').implementation = function (key) {
        if (key.includes("ro.debuggable") || key.includes("ro.secure")) return "0";
        return this.get(key);
    };
}

registerHook("root_detection_hide", hookRootDetectionHide);
