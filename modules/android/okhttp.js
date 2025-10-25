// name: okhttp
// description: Hooks OkHttp request and response flow to log URLs, headers, and bodies (if JSON or text).
// author: Bret McDanel
// version: 1.1
// tags: android, okhttp, network, http, logging
// classes: okhttp3.OkHttpClient, okhttp3.Request, okhttp3.Response, okhttp3.Interceptor

function hookOkHttp() {
    const Interceptor = use("okhttp3.Interceptor");
    const Chain = use("okhttp3.Interceptor$Chain");
    const MediaType = use("okhttp3.MediaType");
    const ResponseBody = use("okhttp3.ResponseBody");
    const OkHttpClient$Builder = use("okhttp3.OkHttpClient$Builder");

    if (!Interceptor || !Chain || !MediaType || !ResponseBody || !OkHttpClient$Builder) return;

    const MyInterceptor = Java.registerClass({
        name: "com.redpanda.OkHttpInterceptor",
        implements: [Interceptor],
        methods: {
            intercept: function (chain) {
                const request = chain.request();
                const url = request.url().toString();
                const headers = request.headers().toString();
                const method = request.method();

                console.log("[okhttp] ->", method, url);
                console.log("[okhttp] Request Headers:\n" + headers);

                const response = chain.proceed(request);
                const respHeaders = response.headers().toString();
                console.log("[okhttp] <- Response Headers:\n" + respHeaders);

                const contentType = response.body().contentType();
                const mime = contentType ? contentType.toString() : "";

                if (mime.includes("application/json") || mime.includes("text/plain")) {
                    try {
                        const rawBody = response.body().string(); // consumes the body
                        console.log("[okhttp] <- Response Body:\n" + rawBody);

                        // Rebuild the body so the app can still use it
                        const newBody = ResponseBody.create(contentType, rawBody);
                        return response.newBuilder().body(newBody).build();
                    } catch (err) {
                        console.error("[okhttp] Error reading response body:", err.message);
                    }
                }

                return response;
            }
        }
    });

    OkHttpClient$Builder.build.implementation = function () {
        this.interceptors().add(MyInterceptor.$new());
        console.log("[okhttp] Interceptor injected");
        return this.build();
    };
}

registerHook("okhttp", hookOkHttp);
