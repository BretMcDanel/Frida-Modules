// name: cell_tower_spoof
// description: Spoofs Android cell tower information across all known APIs.
// author: Bret McDanel
// version: 2.0
// tags: android, telephony, spoofing, cell, privacy
// classes: android.telephony.TelephonyManager, android.telephony.CellInfo, android.telephony.GsmCellLocation, android.telephony.CdmaCellLocation, android.os.SystemProperties, java.lang.reflect.Method
// args:
// - key: cellTower
//   type: object
//   description: Unified config for spoofing cell tower data across all technologies.
//   example: {
//     "cellTower": {
//       "lte": { "mcc": 310, "mnc": 260, "tac": 40401, "ci": 17811 },
//       "gsm": { "lac": 12345, "cid": 67890 },
//       "cdma": { "networkId": 100, "systemId": 200, "baseStationId": 300 },
//       "wcdma": { "lac": 11111, "cid": 22222, "psc": 333 },
//       "nr": { "nci": 44444, "pci": 555, "tac": 66666 }
//     }
//   }

function hookCellTowerSpoof() {
    const spoof = globalThis.FridaConfig?.cellTower;
    if (!spoof || typeof spoof !== "object") {
        console.warn("[cell_tower_spoof] No valid cellTower config in FridaConfig");
        return;
    }

    const TelephonyManager = use("android.telephony.TelephonyManager");
    const ArrayList = use("java.util.ArrayList");

    const CellInfoLte = use("android.telephony.CellInfoLte");
    const CellIdentityLte = use("android.telephony.CellIdentityLte");

    const CellInfoGsm = use("android.telephony.CellInfoGsm");
    const CellIdentityGsm = use("android.telephony.CellIdentityGsm");

    const CellInfoCdma = use("android.telephony.CellInfoCdma");
    const CellIdentityCdma = use("android.telephony.CellIdentityCdma");

    const CellInfoWcdma = use("android.telephony.CellInfoWcdma");
    const CellIdentityWcdma = use("android.telephony.CellIdentityWcdma");

    const CellInfoNr = use("android.telephony.CellInfoNr");
    const CellIdentityNr = use("android.telephony.CellIdentityNr");

    const GsmCellLocation = use("android.telephony.gsm.GsmCellLocation");
    const CdmaCellLocation = use("android.telephony.cdma.CdmaCellLocation");

    if (!TelephonyManager || !ArrayList) return;

    TelephonyManager.getAllCellInfo.implementation = function () {
        console.log("[cell_tower_spoof] getAllCellInfo() intercepted");
        const list = ArrayList.$new();

        if (spoof.lte && CellInfoLte && CellIdentityLte) {
            const cell = CellInfoLte.$new();
            const id = CellIdentityLte.$new(
                spoof.lte.mcc || 310,
                spoof.lte.mnc || 260,
                spoof.lte.ci || 12345,
                spoof.lte.tac || 40401,
                0, 0, 0, 0
            );
            cell.setCellIdentity(id);
            list.add(cell);
        }

        if (spoof.gsm && CellInfoGsm && CellIdentityGsm) {
            const cell = CellInfoGsm.$new();
            const id = CellIdentityGsm.$new(
                spoof.gsm.lac || 12345,
                spoof.gsm.cid || 67890,
                0, 0, 0
            );
            cell.setCellIdentity(id);
            list.add(cell);
        }

        if (spoof.cdma && CellInfoCdma && CellIdentityCdma) {
            const cell = CellInfoCdma.$new();
            const id = CellIdentityCdma.$new(
                spoof.cdma.networkId || 100,
                spoof.cdma.systemId || 200,
                spoof.cdma.baseStationId || 300,
                0, 0
            );
            cell.setCellIdentity(id);
            list.add(cell);
        }

        if (spoof.wcdma && CellInfoWcdma && CellIdentityWcdma) {
            const cell = CellInfoWcdma.$new();
            const id = CellIdentityWcdma.$new(
                spoof.wcdma.lac || 11111,
                spoof.wcdma.cid || 22222,
                spoof.wcdma.psc || 333,
                0, 0
            );
            cell.setCellIdentity(id);
            list.add(cell);
        }

        if (spoof.nr && CellInfoNr && CellIdentityNr) {
            const cell = CellInfoNr.$new();
            const id = CellIdentityNr.$new(
                spoof.nr.nci || 44444,
                spoof.nr.pci || 555,
                spoof.nr.tac || 66666,
                310,
                260
            );
            cell.setCellIdentity(id);
            list.add(cell);
        }

        return list;
    };

    TelephonyManager.getCellLocation.implementation = function () {
        console.log("[cell_tower_spoof] getCellLocation() intercepted");
        if (spoof.gsm && GsmCellLocation) {
            const loc = GsmCellLocation.$new();
            loc.setLac(spoof.gsm.lac || 12345);
            loc.setCid(spoof.gsm.cid || 67890);
            return loc;
        }
        if (spoof.cdma && CdmaCellLocation) {
            const loc = CdmaCellLocation.$new();
            loc.setNetworkId(spoof.cdma.networkId || 100);
            loc.setSystemId(spoof.cdma.systemId || 200);
            loc.setBaseStationId(spoof.cdma.baseStationId || 300);
            return loc;
        }
        return this.getCellLocation();
    };

    const Method = use("java.lang.reflect.Method");
    Method.invoke.implementation = function (receiver, args) {
        const name = this.getName();
        const declaring = this.getDeclaringClass().getName();
        if (declaring.includes("TelephonyManager")) {
            if (name === "getAllCellInfo") {
                console.log("[cell_tower_spoof] Reflective getAllCellInfo() intercepted");
                return TelephonyManager.getAllCellInfo.call(receiver);
            }
            if (name === "getCellLocation") {
                console.log("[cell_tower_spoof] Reflective getCellLocation() intercepted");
                return TelephonyManager.getCellLocation.call(receiver);
            }
        }
        return this.invoke(receiver, args);
    };

    const SystemProperties = use("android.os.SystemProperties");
    if (SystemProperties.get) {
        SystemProperties.get.overload('java.lang.String').implementation = function (key) {
            if (key && key.toLowerCase().includes("gsm.cell.location")) {
                console.log(`[cell_tower_spoof] SystemProperties.get("${key}") intercepted`);
                return `${spoof.gsm.lac || 12345},${spoof.gsm.cid || 67890}`;
            }
            return this.get(key);
        };
    }
}

registerHook("cell_tower_spoof", hookCellTowerSpoof);
