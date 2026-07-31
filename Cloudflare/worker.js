const ROUTES = Object.freeze({
  "/api/auth/request-code": "auth.requestCode",
  "/api/auth/verify-code": "auth.verifyCode",
  "/api/auth/validate-session": "auth.validateSession"
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = buildCorsHeaders(origin, env.ALLOWED_ORIGINS);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const action = ROUTES[new URL(request.url).pathname];
    if (request.method !== "POST" || !action) {
      return json({ ok: false, message: "Ruta no disponible." }, 404, corsHeaders);
    }
    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return json({ ok: false, message: "Origen no autorizado." }, 403, corsHeaders);
    }

    try {
      const payload = await request.json();
      const upstream = await fetch(env.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action, payload, bridgeSecret: env.BRIDGE_SECRET }),
        redirect: "follow"
      });
      const data = await upstream.json();
      return json(data, data.ok ? 200 : statusFor(data.code), corsHeaders);
    } catch (error) {
      console.error("Bridge error", error);
      return json(
        { ok: false, message: "El servicio no está disponible temporalmente." },
        502,
        corsHeaders
      );
    }
  }
};

function buildCorsHeaders(origin, allowedOrigins) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Type": "application/json;charset=UTF-8"
  };
  if (isAllowedOrigin(origin, allowedOrigins)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
}

function isAllowedOrigin(origin, allowedOrigins = "") {
  return allowedOrigins.split(",").map(value => value.trim()).filter(Boolean).includes(origin);
}
function statusFor(code) {
  if (code === "UNAUTHORIZED" || code === "UNAUTHORIZED_BRIDGE") return 401;
  if (code === "RATE_LIMITED" || code === "TOO_MANY_ATTEMPTS") return 429;
  if (code === "ACTION_NOT_FOUND") return 404;
  if (code === "INTERNAL_ERROR") return 500;
  return 400;
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
