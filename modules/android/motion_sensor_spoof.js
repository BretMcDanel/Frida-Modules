// name: motion_sensor_spoof
// description: Spoofs Android motion sensor data across all known APIs.
// author: Bret McDanel
// version: 2.0
// tags: android, sensor, spoofing, motion, privacy
// classes: android.hardware.SensorEventListener, android.hardware.SensorEvent, android.hardware.SensorManager, android.hardware.Sensor, java.lang.reflect.Method
// args:
// - key: motion
//   type: object
//   description: Motion sensor spoofing config. Supports fixed values or randomized simulation.
//   example: {
//     "motion": {
//       "accelerometer": [0.0, 9.8, 0.0],
//       "gyroscope": [0.01, 0.02, 0.03],
//       "randomMotion": true,
//       "sensorMetadata": {
//         "name": "Bosch Accelerometer",
//         "vendor": "Bosch",
//         "version": 3,
//         "type": 1
//       }
//     }
//   }

function hookMotionSensorSpoof() {
    const config = globalThis.FridaConfig?.motion;
    if (!config || typeof config !== "object") {
        console.warn("[motion_sensor_spoof] No valid motion config in FridaConfig");
        return;
    }

    const SensorEventListener = use("android.hardware.SensorEventListener");
    const Sensor = use("android.hardware.Sensor");
    const SensorManager = use("android.hardware.SensorManager");
    const Method = use("java.lang.reflect.Method");
    const ArrayList = use("java.util.ArrayList");

    const randomize = config.randomMotion === true;

    function spoofValues(sensorType) {
        if (randomize) {
            return [
                (Math.random() * 2 - 1) * 9.8,
                (Math.random() * 2 - 1) * 9.8,
                (Math.random() * 2 - 1) * 9.8
            ];
        }
        return config[sensorType] || [0.0, 0.0, 0.0];
    }

    SensorEventListener.onSensorChanged.implementation = function (event) {
        const type = event.sensor.getType();
        if (type === Sensor.TYPE_ACCELEROMETER && config.accelerometer) {
            const spoofed = spoofValues("accelerometer");
            console.log("[motion_sensor_spoof] Spoofing accelerometer:", spoofed);
            event.values[0] = spoofed[0];
            event.values[1] = spoofed[1];
            event.values[2] = spoofed[2];
        } else if (type === Sensor.TYPE_GYROSCOPE && config.gyroscope) {
            const spoofed = spoofValues("gyroscope");
            console.log("[motion_sensor_spoof] Spoofing gyroscope:", spoofed);
            event.values[0] = spoofed[0];
            event.values[1] = spoofed[1];
            event.values[2] = spoofed[2];
        }
        this.onSensorChanged(event);
    };

    SensorManager.getSensorList.implementation = function (type) {
        console.log("[motion_sensor_spoof] getSensorList() intercepted");
        const list = ArrayList.$new();
        const sensor = Sensor.$new();

        if (config.sensorMetadata) {
            sensor.getName.implementation = function () {
                return config.sensorMetadata.name || "SpoofedSensor";
            };
            sensor.getVendor.implementation = function () {
                return config.sensorMetadata.vendor || "SpoofVendor";
            };
            sensor.getVersion.implementation = function () {
                return config.sensorMetadata.version || 1;
            };
            sensor.getType.implementation = function () {
                return config.sensorMetadata.type || Sensor.TYPE_ACCELEROMETER;
            };
        }

        list.add(sensor);
        return list;
    };

    Method.invoke.implementation = function (receiver, args) {
        const name = this.getName();
        const declaring = this.getDeclaringClass().getName();
        if (declaring.includes("SensorEventListener") && name === "onSensorChanged") {
            console.log("[motion_sensor_spoof] Reflective onSensorChanged() intercepted");
            return SensorEventListener.onSensorChanged.call(receiver, args[0]);
        }
        return this.invoke(receiver, args);
    };
}

registerHook("motion_sensor_spoof", hookMotionSensorSpoof);
