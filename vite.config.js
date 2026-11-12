import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleGeminiRequest } from "./api/gemini.js";

function geminiDevProxyPlugin(env) {
  return {
    name: "gemini-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/gemini", async (req, res, next) => {
        const reqPath = (req.url || "").split("?")[0];
        if (reqPath && reqPath !== "/") {
          return next();
        }

        try {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const rawBody = Buffer.concat(chunks);
          const method = (req.method || "GET").toUpperCase();

          const webRequest = new Request(`http://localhost/api/gemini${req.url || ""}`, {
            method,
            headers: {
              "content-type": req.headers["content-type"] || "application/json",
            },
            ...(method !== "GET" && method !== "HEAD" && rawBody.length > 0
              ? { body: rawBody }
              : {}),
          });

          const webResponse = await handleGeminiRequest(webRequest, env);
          res.statusCode = webResponse.status;
          webResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          const bodyBuffer = Buffer.from(await webResponse.arrayBuffer());
          res.end(bodyBuffer);
        } catch (err) {
          console.error("[vite gemini proxy] Error:", err?.message || err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Local Gemini dev proxy failed" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), geminiDevProxyPlugin(env)],
  };
});
