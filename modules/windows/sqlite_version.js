// name: sqlite_version
// description: Loads sqlite3.dll and prints the SQLite version.
// author: Bret McDanel
// version: 1.1
// tags: windows, sqlite, dll, version
// classes: (none)
// args:
// - key: sqlitePath
//   type: string
//   description: Absolute or relative path to sqlite3.dll for dynamic loading.
//   example: { "sqlitePath": "C:\\Program Files\\SQLite\\sqlite3.dll" }

function hookSqliteVersion() {
    try {
        const dllPath = globalThis.FridaConfig?.sqlitePath || "sqlite3.dll";
        const handle = Module.load(dllPath);
        console.log("[sqlite_version] Loaded:", dllPath);

        const addr = Module.findExportByName("sqlite3.dll", "sqlite3_libversion");
        if (!addr) {
            console.error("[sqlite_version] sqlite3_libversion not found");
            return;
        }

        const sqlite3_libversion = new NativeFunction(addr, 'pointer', []);
        const versionPtr = sqlite3_libversion();
        const versionStr = Memory.readUtf8String(versionPtr);

        console.log("[sqlite_version] SQLite version:", versionStr);
    } catch (err) {
        console.error("[sqlite_version] Error:", err.message);
    }
}

registerHook("sqlite_version", hookSqliteVersion);
