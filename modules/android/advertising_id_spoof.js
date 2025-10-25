// name: advertising_id_spoof
// description: Spoofs Google Advertising ID.
// author: Bret McDanel
// version: 1.0
// tags: android, advertising, spoofing, privacy
// classes: com.google.android.gms.ads.identifier.AdvertisingIdClient
// args:
// - key: advertisingId
//   type: string
//   description: Google Advertising ID to spoof
//   example: { "advertisingId": "38400000-8cf0-11bd-b23e-10b96e40000d" }

function hookAdvertisingIdSpoof() {
    const spoofed = globalThis.FridaConfig?.advertisingId;
    if (!spoofed || typeof spoofed !== "string") {
        console.warn("[advertising_id_spoof] No valid Advertising ID in FridaConfig.advertisingId");
        return;
    }

    const Info = use("com.google.android.gms.ads.identifier.AdvertisingIdClient$Info");
    if (Info && Info.getId) {
        Info.getId.implementation = function () {
            console.log("[advertising_id_spoof] getId() intercepted");
            return spoofed;
        };
    }
}

registerHook("advertising_id_spoof", hookAdvertisingIdSpoof);
