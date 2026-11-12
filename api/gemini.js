const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_ID_REGEX = /^gemini-[a-z0-9.-]{1,64}$/i;
const UPSTREAM_TIMEOUT_MS = 25000;

function readServerApiKey(env = process.env) {
  const raw = env?.GEMINI_API_KEY || env?.GOOGLE_GENERATIVE_AI_API_KEY || "";
  return String(raw).replace(/['"\s]/g, "");
}

function buildSanitizedPayload(payload) {
  const clean = { contents: payload.contents };
  if (payload.system_instruction && typeof payload.system_instruction === "object") {
    clean.system_instruction = payload.system_instruction;
  }
  if (payload.generationConfig && typeof payload.generationConfig === "object") {
    clean.generationConfig = payload.generationConfig;
  }
  if (Array.isArray(payload.safetySettings)) {
    clean.safetySettings = payload.safetySettings;
  }
  return clean;
}

/**
 * Shared Web-standard handler for /api/gemini used by both Vercel Functions
 * and Vite's local dev server middleware.
 */
export async function handleGeminiRequest(request, env = process.env) {
  const method = (request.method || "GET").toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, POST, OPTIONS" },
    });
  }

  const apiKey = readServerApiKey(env);

  if (method === "GET") {
    return Response.json({ ok: true, configured: Boolean(apiKey) });
  }

  if (method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "GET, POST, OPTIONS" } }
    );
  }

  if (!apiKey) {
    return Response.json(
      { error: "Server Gemini API key is not configured." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const model = typeof body?.model === "string" ? body.model.trim() : "";
  const payload = body?.payload;

  if (!MODEL_ID_REGEX.test(model) || model.includes("..")) {
    return Response.json({ error: "Invalid or unsupported Gemini model ID." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || !Array.isArray(payload.contents) || payload.contents.length === 0) {
    return Response.json({ error: "Request payload.contents must be a non-empty array." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamUrl = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(buildSanitizedPayload(payload)),
    });

    const responseText = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8";

    if (!upstreamResponse.ok) {
      console.error(`[api/gemini] Upstream HTTP ${upstreamResponse.status} for model ${model}`);
    }

    return new Response(responseText, {
      status: upstreamResponse.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    const isAbort = err?.name === "AbortError";
    console.error("[api/gemini] Request failed:", err?.message || err);
    return Response.json(
      { error: isAbort ? "Gemini upstream request timed out." : "Failed to reach Gemini API." },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export default {
  async fetch(request) {
    return handleGeminiRequest(request, process.env);
  },
};
