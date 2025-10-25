// name: instrumentation_debugger_hide
// description: Hides instrumentation and debugger presence.
// author: Bret McDanel
// version: 2.0
// tags: android, instrumentation, debugger, hiding, privacy
// classes: android.os.Debug, java.lang.System
// args:
// - key: hideInstrumentation
//   type: boolean
//   description: Toggle to hide debugger and instrumentation.
//   example: { "hideInstrumentation": true }

function hookInstrumentationDebuggerHide() {
    if (!globalThis.FridaConfig?.hideInstrumentation) return;

    const Debug = use("android.os.Debug");
    Debug.isDebuggerConnected.implementation = () => false;
    Debug.waitingForDebugger.implementation = () => false;

    const System = use("java.lang.System");
    System.getProperty.overload('java.lang.String').implementation = function (key) {
        if (key === "ro.debuggable") return "0";
        return this.getProperty(key);
    };
}

registerHook("instrumentation_debugger_hide", hookInstrumentationDebuggerHide);
