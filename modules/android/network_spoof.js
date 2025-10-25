// name: network_spoof
// description: Spoofs proxy, VPN status, and user agent string.
// author: Bret McDanel
// version: 2.0
// tags: android, network, spoofing, privacy
// classes: java.lang.System, android.net.ConnectivityManager, java.net.Proxy
// args:
// - key: network
//   type: object
//   description: Network spoof config.
//   example: {
//     "network": {
//       "proxyEnabled": false,
//       "vpnActive": false,
//       "userAgent": "Mozilla/5.0 (Android 14; Pixel 9)"
//     }
//   }

function hookNetworkSpoof() {
    const spoof = globalThis.FridaConfig?.network;
    if (!spoof || typeof spoof !== "object") return;

    const System = use("java.lang.System");
    System.getProperty.overload('java.lang.String').implementation = function (key) {
        if (key === "http.proxyHost" && spoof.proxyEnabled === false) return null;
        if (key === "http.proxyPort" && spoof.proxyEnabled === false) return null;
        return this.getProperty(key);
    };

    const ConnectivityManager = use("android.net.ConnectivityManager");
    ConnectivityManager.getNetworkInfo.overload('int').implementation = function (type) {
        const info = this.getNetworkInfo(type);
        if (spoof.vpnActive === false && type === ConnectivityManager.TYPE_VPN) {
            info.isConnected.implementation = () => false;
        }
        return info;
    };

    const WebSettings = use("android.webkit.WebSettings");
    WebSettings.getUserAgentString.implementation = function () {
        return spoof.userAgent || this.getUserAgentString();
    };
}

registerHook("network_spoof", hookNetworkSpoof);
