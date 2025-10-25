# Modular Frida Hook System
This repository provides a framework for managing Frida hook scripts using modular JavaScript files and a Python CLI builder. Each module is self-contained, metadata-tagged, and can be selectively bundled into a unified Frida script for reverse engineering, forensic analysis, or penetration testing.

The system supports metadata parsing, class resolution abstraction, build logging, and CLI features for listing, describing, and filtering modules.

# Features
Modular JavaScript hooks with top-of-file metadata

Centralized Java.use abstraction with error handling and class caching

Python 3 build script with CLI flags for listing, describing, filtering, and dry-run previewing

Forensic build logging with timestamps and module descriptions

Easy integration into pentest workflows and forensic pipelines

# Usage
Build a Frida script with selected modules
```bash
python3 build.py -m sift clientinfo devicedata
```
Preview build without writing output
```bash
python3 build.py -m sift clientinfo --dry-run
```
Disable logging
```bash
python3 build.py -m sift clientinfo --nolog
```
### Modules
List available modules
```bash
python3 build.py --list
```
Filter modules by tag
```bash
python3 build.py --list --tags sdk
```
Describe a specific module
```bash
python3 build.py --describe sift
```
### Configuration
Configuration data is a JSON object where the key is the identifier and the value is the parameter.  Modules can utilize these for dynamic values.  The JSON data can be passed either as a string on the commandline or via a file.  

Provide module configuration via CLI
```bash
python3 build.py -m windows/sqlite_version --config '{"sqlitePath":"C:\\Temp\\sqlite3.dll"}'
python3 build.py -m android/location_spoof.js --config '{"location":{"latitude":48.8584,"longitude":2.2945}}'
python3 build.py -m module1 module2 --config '{"option1":"value1","option2":"value2"}'
```
Provide module configuration via FILE
```bash
python3 build.py -m windows/sqlite_version --config config.json
```

# Current Modules
- **advertising_id_spoof**: Spoofs Google Advertising ID.  
- **android_id_spoof**: Spoofs Android ID.  
- **app_spoof**: Spoofs app identity and environment including package name, install source, signature, and feature flags.  
- **cell_tower_spoof**: Spoofs Android cell tower information across all known APIs.  
- **device_fingerprint_spoof**: Spoofs device fingerprint, model, manufacturer, serial, bootloader status, and emulator detection.  
- **instrumentation_debugger_hide**: Hides instrumentation and debugger presence.  
- **locale_timezone_spoof**: Spoofs locale and timezone settings.  
- **location_spoof**: Spoofs Android location APIs (fine and coarse).  
- **motion_sensor_spoof**: Spoofs Android motion sensor data across all known APIs.  
- **network_spoof**: Spoofs proxy, VPN status, and user agent string.  
- **okhttp**: Hooks OkHttp request and response flow to log URLs, headers, and bodies (if JSON or text).  
- **root_detection_hide**: Hides root detection flags including su binary, known paths, and system properties.  
- **sift**: Hooks all major Sift SDK methods including config builder, user/session/device IDs, and payloads.  
- **sim_spoof**: Spoofs SIM, telephony, and carrier identity across Java and native layers with dual SIM support.  
- **wifi_spoof**: Spoofs Wi-Fi SSID, BSSID, and scan results.  
- **sqlite_version**: Loads sqlite3.dll and prints the SQLite version.  

# Logging
By default, each build appends a forensic log entry to build.log with:
* Timestamp
* Output file path
* Included modules and descriptions
* Config options
* Classes each module would interface with

This supports audit trails and pentest reporting.

# Module Format
Each module is a standalone .js file with metadata comments at the top:

```javascript
// name: skeleton
// version: 1.0
// description: Skeleton template that does nothing useful
// author: Bret McDanel
// tags: skeleton, template
// classes: com.android.someClass

function hookSkeleton() {
    const skel = use("com.android.someClass");
    if (!skel) return;

    skel.someMethod.implementation = function () {
        console.log("[Skel] someMethod() called");
        return this.someMethod();
    };
}
registerHook("skeleton", hookSkeleton);
```
## Metadata
The first few lines of the module can (should) contain comments that describe the module.  These are especially helpful for a pentest or otherwise writing a report.  The most important are ```name```, ```description```, ```version```, and ```classes```.  These help when it is time to document what was done for replication of any findings.  These items will be written to a logfile when the script is built.

### Args
This is an optional header block that identifies what arguments the module supports.  See the [configuration](#configuration) section for how to pass these values.
```javascript
// args:
// - key: variable_name
//   type: string
//   description: A human readable description of this value
//   example: "12345"
```

## Header.js
The ```header.js``` file includes shared helper functions that make it easier for all modules to work together. It helps keep things organized, avoids repeating code, and makes everything run more smoothly.

## Registering Hooks
Each module should put its code inside a function with a unique name. To make sure the function runs when the script starts, you need to register it using:

```javascript
registerHook("name", functionName);
```
This tells the system to run your function during setup.

## Class reference
Normally in Frida, you use ```Java.use()``` to get access to a Java class. But in a system with many modules, the same class might be loaded more than once, which can cause problems, slow down the script, and consume more memory.

To fix this, header.js provides a ```use()``` function that loads each class only once and saves it for later. This avoids repeating work and helps all modules use the same version of each class. 

## Accessing Config parameters in Modules
Configuration data can be passed to modules (see [Config Examples](#configuration)).  Modules can access these values by accessing the ```globalThis.FridaConfig``` object.
```javascript
const logLevel = globalThis.FridaConfig?.logLevel || "info";
```
Use defaults when values are missing to avoid errors with missing options.

# License
This repository is provided under the MIT License. See LICENSE for details.