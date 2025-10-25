// name: wifi_spoof
// description: Spoofs Wi-Fi SSID, BSSID, and scan results.
// author: Bret McDanel
// version: 2.0
// tags: android, wifi, spoofing, privacy, networking
// classes: android.net.wifi.WifiInfo, android.net.wifi.ScanResult, android.net.wifi.WifiManager, android.os.SystemProperties, java.lang.reflect.Method
// args:
// - key: wifiNetworks
//   type: array
//   description: List of spoofed Wi-Fi networks. First entry is used as current connection.
//   example: {
//     "wifiNetworks": [
//       { "ssid": "TestNet1", "bssid": "00:11:22:33:44:55", "level": -45 },
//       { "ssid": "TestNet2", "bssid": "66:77:88:99:AA:BB", "level": -60 }
//     ]
//   }

function hookWifiSpoof() {
    const spoofList = globalThis.FridaConfig?.wifiNetworks;
    if (!Array.isArray(spoofList) || spoofList.length === 0) {
        console.warn("[wifi_spoof] No valid wifiNetworks list in FridaConfig");
        return;
    }

    const primary = spoofList[0];
    const WifiInfo = use("android.net.wifi.WifiInfo");
    const ScanResult = use("android.net.wifi.ScanResult");
    const WifiManager = use("android.net.wifi.WifiManager");
    const ArrayList = use("java.util.ArrayList");

    if (WifiInfo.getSSID && primary.ssid) {
        WifiInfo.getSSID.implementation = function () {
            console.log("[wifi_spoof] getSSID() intercepted");
            return `"${primary.ssid}"`;
        };
    }

    if (WifiInfo.getBSSID && primary.bssid) {
        WifiInfo.getBSSID.implementation = function () {
            console.log("[wifi_spoof] getBSSID() intercepted");
            return primary.bssid;
        };
    }

    if (WifiManager.getScanResults) {
        WifiManager.getScanResults.implementation = function () {
            console.log("[wifi_spoof] getScanResults() intercepted");
            const list = ArrayList.$new();
            spoofList.forEach(net => {
                const result = ScanResult.$new();
                result.SSID.value = net.ssid || "UnknownSSID";
                result.BSSID.value = net.bssid || "00:00:00:00:00:00";
                result.level.value = net.level || -50;
                list.add(result);
            });
            return list;
        };
    }

    const Method = use("java.lang.reflect.Method");
    Method.invoke.implementation = function (receiver, args) {
        const name = this.getName();
        const declaring = this.getDeclaringClass().getName();
        if (declaring.includes("WifiInfo")) {
            if (name === "getSSID" && primary.ssid) {
                console.log("[wifi_spoof] Reflective getSSID() intercepted");
                return `"${primary.ssid}"`;
            }
            if (name === "getBSSID" && primary.bssid) {
                console.log("[wifi_spoof] Reflective getBSSID() intercepted");
                return primary.bssid;
            }
        }
        return this.invoke(receiver, args);
    };

    const SystemProperties = use("android.os.SystemProperties");
    if (SystemProperties.get) {
        SystemProperties.get.overload('java.lang.String').implementation = function (key) {
            if (key && key.toLowerCase().includes("wifi.ssid")) {
                console.log(`[wifi_spoof] SystemProperties.get("${key}") intercepted`);
                return primary.ssid;
            }
            if (key && key.toLowerCase().includes("wifi.bssid")) {
                console.log(`[wifi_spoof] SystemProperties.get("${key}") intercepted`);
                return primary.bssid;
            }
            return this.get(key);
        };
    }
}

registerHook("wifi_spoof", hookWifiSpoof);
