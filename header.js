const Classes = {};
const ResolvedClasses = [];
const HookRegistry = [];

function use(className) {
    if (Classes[className]) return Classes[className];
    try {
        const resolved = Java.use(className);
        Classes[className] = resolved;
        ResolvedClasses.push(className);
        return resolved;
    } catch (err) {
        console.error(`[!] Failed to resolve ${className}: ${err.message}`);
        Classes[className] = null;
        return null;
    }
}

// Register a hook function with optional metadata
function registerHook(name, callback) {
    if (typeof callback !== "function") {
        console.warn(`[!] Hook "${name}" is not a function`);
        return;
    }
    HookRegistry.push({ name, callback });
}

// Execute all registered hooks
function runHooks() {
    console.log(`[+] Running ${HookRegistry.length} registered hooks`);
    HookRegistry.forEach(entry => {
        try {
            console.log(`[+] Executing hook: ${entry.name}`);
            entry.callback();
        } catch (err) {
            console.error(`[!] Error in hook "${entry.name}": ${err.message}`);
        }
    });
    console.log("[+] Resolved classes:", JSON.stringify(ResolvedClasses));
}
