// name: sim_spoof
// description: Spoofs SIM, telephony, and carrier identity across Java and native layers with dual SIM support.
// author: Bret McDanel
// version: 6.0
// tags: android, sim, spoofing, telephony, privacy, native, dualsim
// classes: android.telephony.TelephonyManager, android.telephony.SubscriptionManager, android.telephony.SubscriptionInfo, android.os.SystemProperties, android.os.Build, android.provider.Settings$Global, android.provider.Settings$Secure, java.lang.reflect.Method
// args:
// - key: sim
//   type: array
//   description: List of SIM profiles to spoof. Index 0 is slot 1, index 1 is slot 2.
//   example: {
//     "sim": [
//       {
//         "imei": "867530986753098",
//         "imsi": "310260123456789",
//         "phoneNumber": "+15558675309",
//         "simSerial": "8991101200003204510",
//         "carrierName": "TestCarrier1",
//         "mccMnc": "310260",
//         "serial": "ABC123XYZ"
//       },
//       {
//         "imei": "867530912345678",
//         "imsi": "310260987654321",
//         "phoneNumber": "+15558670000",
//         "simSerial": "8991101200003204522",
//         "carrierName": "TestCarrier2",
//         "mccMnc": "310270",
//         "serial": "DEF456UVW"
//       }
//     ]
//   }

function hookSimSpoof() {
    const sims = globalThis.FridaConfig?.sim;
    if (!Array.isArray(sims) || sims.length === 0) return;

    const TelephonyManager = use("android.telephony.TelephonyManager");
    const SubscriptionManager = use("android.telephony.SubscriptionManager");
    const SubscriptionInfo = use("android.telephony.SubscriptionInfo");
    const SystemProperties = use("android.os.SystemProperties");
    const Build = use("android.os.Build");
    const Global = use("android.provider.Settings$Global");
    const Secure = use("android.provider.Settings$Secure");
    const Method = use("java.lang.reflect.Method");

    // Build serial and bootloader
    if (sims[0].serial) {
        Build.getSerial.implementation = () => sims[0].serial;
        Build.SERIAL.value = sims[0].serial;
    }
    Build.getBootloader.implementation = () => "spoofed-bootloader";
    Build.getRadioVersion.implementation = () => "spoofed-radio";

    // TelephonyManager (slot 0)
    if (TelephonyManager) {
        TelephonyManager.getImei.implementation = () => sims[0].imei;
        TelephonyManager.getDeviceId.implementation = () => sims[0].imei;
        TelephonyManager.getSubscriberId.implementation = () => sims[0].imsi;
        TelephonyManager.getLine1Number.implementation = () => sims[0].phoneNumber;
        TelephonyManager.getSimSerialNumber.implementation = () => sims[0].simSerial;
        TelephonyManager.getNetworkOperatorName.implementation = () => sims[0].carrierName;
        TelephonyManager.getSimOperatorName.implementation = () => sims[0].carrierName;
        TelephonyManager.getNetworkOperator.implementation = () => sims[0].mccMnc;
        TelephonyManager.getSimOperator.implementation = () => sims[0].mccMnc;
        TelephonyManager.getPhoneCount.implementation = () => sims.length;
        TelephonyManager.getPhoneType.implementation = () => TelephonyManager.PHONE_TYPE_GSM.value;
        TelephonyManager.getSimState.implementation = () => TelephonyManager.SIM_STATE_READY.value;
    }

    // SubscriptionManager dual SIM
    SubscriptionManager.getActiveSubscriptionInfoList.implementation = function () {
        const ArrayList = use("java.util.ArrayList");
        const list = ArrayList.$new();
        sims.forEach((sim, index) => {
            const info = SubscriptionInfo.$new();
            info.getCarrierName.implementation = () => sim.carrierName;
            info.getNumber.implementation = () => sim.phoneNumber;
            info.getMccString.implementation = () => sim.mccMnc.slice(0, 3);
            info.getMncString.implementation = () => sim.mccMnc.slice(3);
            info.getSimSlotIndex.implementation = () => index;
            list.add(info);
        });
        return list;
    };

    // SystemProperties
    SystemProperties.get.overload('java.lang.String').implementation = function (key) {
        const k = key.toLowerCase();
        if (k.includes("imei")) return sims[0].imei;
        if (k.includes("imsi")) return sims[0].imsi;
        if (k.includes("line1")) return sims[0].phoneNumber;
        if (k.includes("sim.serial")) return sims[0].simSerial;
        if (k.includes("gsm.operator.numeric")) return sims[0].mccMnc;
        if (k.includes("gsm.operator.alpha")) return sims[0].carrierName;
        return this.get(key);
    };

    // Settings spoofing
    Global.getString.overload('android.content.ContentResolver', 'java.lang.String').implementation = function (resolver, name) {
        if (name === "device_provisioned") return "1";
        if (name === "carrier_name_override") return sims[0].carrierName;
        return this.getString(resolver, name);
    };
    Secure.getString.overload('android.content.ContentResolver', 'java.lang.String').implementation = function (resolver, name) {
        if (name === "carrier_name_override") return sims[0].carrierName;
        return this.getString(resolver, name);
    };

    // Reflective access
    Method.invoke.implementation = function (receiver, args) {
        const name = this.getName();
        const declaring = this.getDeclaringClass().getName();
        if (declaring.includes("TelephonyManager")) {
            if (name === "getImei") return sims[0].imei;
            if (name === "getDeviceId") return sims[0].imei;
            if (name === "getSubscriberId") return sims[0].imsi;
            if (name === "getLine1Number") return sims[0].phoneNumber;
            if (name === "getSimSerialNumber") return sims[0].simSerial;
            if (name === "getNetworkOperatorName") return sims[0].carrierName;
            if (name === "getNetworkOperator") return sims[0].mccMnc;
        }
        return this.invoke(receiver, args);
    };

    // Native __system_property_get
    const propMap = {
        "ril.IMEI": sims[0].imei,
        "ril.IMSI": sims[0].imsi,
        "gsm.sim.serial": sims[0].simSerial,
        "gsm.operator.alpha": sims[0].carrierName,
        "gsm.operator.numeric": sims[0].mccMnc
    };
    const addr = Module.findExportByName(null, "__system_property_get");
    if (addr) {
        Interceptor.attach(addr, {
            onEnter(args) {
                this.key = Memory.readUtf8String(args[0]);
                this.buf = args[1];
            },
            onLeave(retval) {
                if (this.key in propMap && typeof propMap[this.key] === "string") {
                    Memory.writeUtf8String(this.buf, propMap[this.key]);
                    retval.replace(ptr(propMap[this.key].length));
                    console.log(`[sim_spoof] __system_property_get("${this.key}") spoofed`);
                }
            }
        });
    }
}

registerHook("sim_spoof", hookSimSpoof);
