/**
 * Buddy free online brain — a Cloudflare Worker.
 *
 * It runs an AI model on Cloudflare's free Workers AI allowance
 * (10,000 "neurons" a day, resets at midnight UTC), so nobody who
 * installs the app ever needs an API key.
 *
 * Needs ONE binding:   AI  -> Workers AI
 * Optional:            LIMITER -> rate-limit binding (see wrangler.toml)
 * Optional variable:   APP_TOKEN -> same value as freeAiToken in the app
 */

// Good balance of smarts vs. free allowance (~500+ replies a day).
// Swap for "@cf/meta/llama-3.3-70b-instruct-fp8-fast" for a smarter
// brain that uses the allowance up much faster.
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const MAX_REPLY_TOKENS = 700;
const MAX_HISTORY = 14;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return json({ ok: true, name: "buddy-brain", model: MODEL });
    }
    if (request.method !== "POST") return json({ error: "POST only" }, 405);

    // Simple shared password so random websites can't use your allowance.
    if (env.APP_TOKEN && request.headers.get("x-app-token") !== env.APP_TOKEN) {
      return json({ error: "not allowed" }, 401);
    }

    // Per-phone speed limit (stops one person draining the day's allowance).
    const device =
      request.headers.get("x-device") ||
      request.headers.get("cf-connecting-ip") ||
      "anon";
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: device });
      if (!success) return json({ error: "slow_down" }, 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }

    const system = String(body.system || "").slice(0, 12000);
    const history = Array.isArray(body.messages) ? body.messages : [];
    const messages = [{ role: "system", content: system }];
    for (const m of history.slice(-MAX_HISTORY)) {
      if (!m || typeof m.content !== "string") continue;
      const role = m.role === "assistant" ? "assistant" : "user";
      messages.push({ role, content: m.content.slice(0, 8000) });
    }

    try {
      const out = await env.AI.run(MODEL, {
        messages,
        max_tokens: Math.min(Number(body.max_tokens) || MAX_REPLY_TOKENS, 1500),
        temperature: 0.7,
      });
      const reply =
        (out && typeof out.response === "string" && out.response) ||
        (out && out.choices && out.choices[0] && out.choices[0].message &&
          out.choices[0].message.content) ||
        "";
      return json({ reply, model: MODEL });
    } catch (e) {
      // Usually means today's free allowance is used up.
      // The app will quietly switch to the on-phone AI.
      return json({ error: "ai_unavailable", detail: String(e) }, 503);
    }
  },
};
