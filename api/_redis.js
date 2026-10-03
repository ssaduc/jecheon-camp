// Upstash Redis REST helper (no dependencies). Vercel Marketplace sets either
// UPSTASH_REDIS_REST_* or KV_REST_API_* variables; both are supported.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(...cmd) {
  if (!URL_ || !TOKEN) throw new Error("Redis 환경변수가 설정되지 않았습니다");
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
module.exports = { redis };
