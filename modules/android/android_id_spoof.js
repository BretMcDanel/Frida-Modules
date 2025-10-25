// name: android_id_spoof
// description: Spoofs Android ID.
// author: Bret McDanel
// version: 1.0
// tags: android, spoofing, settings, privacy
// classes: android.provider.Settings$Secure
// args:
// - key: androidId
//   type: string
//   description: Android ID to spoof
//   example: { "androidId": "9774d56d682e549c" }

function hookAndroidIdSpoof() {
    const spoofed = globalThis.FridaConfig?.androidId;
    if (!spoofed || typeof spoofed !== "string") {
        console.warn("[android_id_spoof] No valid Android ID in FridaConfig.androidId");
        return;
    }

    const Secure = use("android.provider.Settings$Secure");
    Secure.getString.overload('android.content.ContentResolver', 'java.lang.String').implementation = function (resolver, name) {
        if (name === Secure.ANDROID_ID.value) {
            console.log("[android_id_spoof] getString(ANDROID_ID) intercepted");
            return spoofed;
        }
        return this.getString(resolver, name);
    };
}

registerHook("android_id_spoof", hookAndroidIdSpoof);
