// name: locale_timezone_spoof
// description: Spoofs locale and timezone settings.
// author: Bret McDanel
// version: 2.0
// tags: android, locale, timezone, spoofing, privacy
// classes: java.util.Locale, java.util.TimeZone
// args:
// - key: locale
//   type: string
//   description: Locale string (e.g. "fr_FR").
//   example: { "locale": "fr_FR" }
// - key: timezone
//   type: string
//   description: Timezone ID (e.g. "Europe/Paris").
//   example: { "timezone": "Europe/Paris" }

function hookLocaleTimezoneSpoof() {
    const loc = globalThis.FridaConfig?.locale;
    const tz = globalThis.FridaConfig?.timezone;

    const Locale = use("java.util.Locale");
    if (loc) {
        Locale.getDefault.implementation = function () {
            const parts = loc.split("_");
            return Locale.$new(parts[0], parts[1] || "");
        };
    }

    const TimeZone = use("java.util.TimeZone");
    if (tz) {
        TimeZone.getDefault.implementation = function () {
            return TimeZone.getTimeZone(tz);
        };
    }
}

registerHook("locale_timezone_spoof", hookLocaleTimezoneSpoof);
