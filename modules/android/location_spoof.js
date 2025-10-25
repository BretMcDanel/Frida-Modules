// name: location_spoof
// description: Spoofs Android location APIs (fine and coarse).
// author: Bret McDanel
// version: 1.0
// tags: android, location, gps, spoofing, privacy
// classes: android.location.Location, android.location.LocationManager, android.location.LocationListener, android.location.LocationRequest
// args:
// - key: location
//   type: object
//   description: Coordinates to spoof device location across all Android location APIs.
//   example: { "location": { "latitude": 48.8584, "longitude": 2.2945 }}

function hookLocationSpoof() {
    const Location = use("android.location.Location");
    const LocationManager = use("android.location.LocationManager");
    const LocationListener = use("android.location.LocationListener");
    const LocationRequest = use("android.location.LocationRequest");

    const spoof = globalThis.FridaConfig?.location;
    if (!spoof || typeof spoof.latitude !== "number" || typeof spoof.longitude !== "number") {
        console.warn("[location_spoof] No valid coordinates in FridaConfig.location");
        return;
    }

    function applySpoof(loc) {
        loc.setLatitude(spoof.latitude);
        loc.setLongitude(spoof.longitude);
        loc.setAccuracy(5.0);
        loc.setTime(Date.now());
        loc.setElapsedRealtimeNanos(android.os.SystemClock.elapsedRealtimeNanos());
        return loc;
    }

    // Hook Location constructor
    Location.$init.overload('java.lang.String').implementation = function (provider) {
        const loc = this.$init(provider);
        return applySpoof(loc);
    };

    // Hook getLastKnownLocation
    LocationManager.getLastKnownLocation.implementation = function (provider) {
        const original = this.getLastKnownLocation(provider);
        if (original) {
            console.log("[location_spoof] getLastKnownLocation spoofed:", provider);
            return applySpoof(original);
        }
        return null;
    };

    // Hook requestLocationUpdates with LocationListener
    LocationManager.requestLocationUpdates.overload(
        'java.lang.String', 'long', 'float', 'android.location.LocationListener'
    ).implementation = function (provider, minTime, minDistance, listener) {
        console.log("[location_spoof] requestLocationUpdates intercepted:", provider);
        const proxy = Java.registerClass({
            name: "com.redpanda.LocationSpoofListener",
            implements: [LocationListener],
            methods: {
                onLocationChanged: function (loc) {
                    listener.onLocationChanged(applySpoof(loc));
                },
                onStatusChanged: function (provider, status, extras) {
                    listener.onStatusChanged(provider, status, extras);
                },
                onProviderEnabled: function (provider) {
                    listener.onProviderEnabled(provider);
                },
                onProviderDisabled: function (provider) {
                    listener.onProviderDisabled(provider);
                }
            }
        });
        return this.requestLocationUpdates(provider, minTime, minDistance, proxy.$new());
    };

    // Hook fused location APIs (if available)
    const FusedLocationProviderClient = use("com.google.android.gms.location.FusedLocationProviderClient");
    if (FusedLocationProviderClient) {
        console.log("[location_spoof] FusedLocationProviderClient detected");
        const Task = use("com.google.android.gms.tasks.Task");
        const LocationCallback = use("com.google.android.gms.location.LocationCallback");

        // Hook getLastLocation()
        FusedLocationProviderClient.getLastLocation.implementation = function () {
            const task = this.getLastLocation();
            task.addOnSuccessListener(Java.use("com.google.android.gms.tasks.OnSuccessListener").$new({
                onSuccess: function (loc) {
                    if (loc) applySpoof(loc);
                }
            }));
            return task;
        }

        // Hook requestLocationUpdates(LocationRequest, LocationCallback, Looper)
        FusedLocationProviderClient.requestLocationUpdates.overload(
            'com.google.android.gms.location.LocationRequest',
            'com.google.android.gms.location.LocationCallback',
            'android.os.Looper'
        ).implementation = function (req, callback, looper) {
            console.log("[location_spoof] requestLocationUpdates (fused) intercepted");
            const proxy = Java.registerClass({
                name: "com.redpanda.FusedLocationSpoofCallback",
                superClass: LocationCallback,
                methods: {
                    onLocationResult: function (result) {
                        const spoofed = result.getLastLocation();
                        if (spoofed) applySpoof(spoofed);
                        callback.onLocationResult(result);
                    }
                }
            });
            return this.requestLocationUpdates(req, proxy.$new(), looper);
        };
    }
}

registerHook("location_spoof", hookLocationSpoof);
