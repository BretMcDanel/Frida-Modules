// name: app_spoof
// description: Spoofs app identity and environment including package name, install source, signature, and feature flags.
// author: Bret McDanel
// version: 2.0
// tags: android, app, spoofing, privacy, environment
// classes: android.content.Context, android.content.pm.PackageManager, android.content.pm.PackageInfo, java.lang.reflect.Method
// args:
// - key: appSpoof
//   type: object
//   description: App spoofing config.
//   example: {
//     "appSpoof": {
//       "packageName": "com.example.fake",
//       "installSource": "com.android.vending",
//       "signature": "ABCDEF1234567890",
//       "features": {
//         "android.hardware.camera": true,
//         "android.hardware.nfc": false
//       }
//     }
//   }

function hookAppSpoof() {
    const spoof = globalThis.FridaConfig?.appSpoof;
    if (!spoof || typeof spoof !== "object") return;

    const Context = use("android.content.Context");
    const PackageManager = use("android.content.pm.PackageManager");
    const PackageInfo = use("android.content.pm.PackageInfo");
    const Signature = use("android.content.pm.Signature");

    if (spoof.packageName) {
        Context.getPackageName.implementation = function () {
            console.log("[app_spoof] getPackageName() intercepted");
            return spoof.packageName;
        };
    }

    if (spoof.installSource) {
        PackageManager.getInstallerPackageName.implementation = function (pkg) {
            console.log("[app_spoof] getInstallerPackageName() intercepted");
            return spoof.installSource;
        };
    }

    if (spoof.signature) {
        PackageManager.getPackageInfo.overload('java.lang.String', 'int').implementation = function (pkg, flags) {
            const info = this.getPackageInfo(pkg, flags);
            if ((flags & PackageManager.GET_SIGNATURES) !== 0 && spoof.signature) {
                const sig = Signature.$new(spoof.signature);
                info.signatures.value = [sig];
            }
            return info;
        };
    }

    if (spoof.features && typeof spoof.features === "object") {
        PackageManager.hasSystemFeature.implementation = function (feature) {
            if (feature in spoof.features) {
                console.log(`[app_spoof] hasSystemFeature("${feature}") spoofed`);
                return spoof.features[feature];
            }
            return this.hasSystemFeature(feature);
        };
    }

    const Method = use("java.lang.reflect.Method");
    Method.invoke.implementation = function (receiver, args) {
        const name = this.getName();
        const declaring = this.getDeclaringClass().getName();

        if (declaring.includes("Context") && name === "getPackageName" && spoof.packageName) {
            console.log("[app_spoof] Reflective getPackageName() intercepted");
            return spoof.packageName;
        }

        if (declaring.includes("PackageManager")) {
            if (name === "getInstallerPackageName" && spoof.installSource) {
                console.log("[app_spoof] Reflective getInstallerPackageName() intercepted");
                return spoof.installSource;
            }
            if (name === "hasSystemFeature" && args.length === 1 && spoof.features?.[args[0]] !== undefined) {
                console.log(`[app_spoof] Reflective hasSystemFeature("${args[0]}") spoofed`);
                return spoof.features[args[0]];
            }
        }

        return this.invoke(receiver, args);
    };
}

registerHook("app_spoof", hookAppSpoof);
