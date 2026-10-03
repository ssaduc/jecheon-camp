const { redis } = require("./_redis");
const DEFAULTS = require("./_defaults.json");
const HASH = "camp:items";

function seedArgs() {
  const a = [];
  DEFAULTS.forEach((d, i) => {
    a.push(d.id, JSON.stringify(Object.assign({ done: false, who: "", note: "", order: i + 1 }, d)));
  });
  return a;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      // first visit ever: seed the default list once
      const first = await redis("SETNX", "camp:seeded", "1");
      if (first === 1) await redis("HSET", HASH, ...seedArgs());
      const flat = (await redis("HGETALL", HASH)) || [];
      const items = {};
      for (let i = 0; i < flat.length; i += 2) {
        try { items[flat[i]] = JSON.parse(flat[i + 1]); } catch (e) {}
      }
      return res.status(200).json({ items });
    }
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const id = String(b.id || "");
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return res.status(400).json({ error: "bad id" });
      if (b.op === "set") {
        await redis("HSET", HASH, id, JSON.stringify(b.doc || {}));
      } else if (b.op === "patch") {
        const cur = await redis("HGET", HASH, id);
        if (!cur) return res.status(404).json({ error: "not found" });
        const merged = Object.assign(JSON.parse(cur), b.patch || {});
        await redis("HSET", HASH, id, JSON.stringify(merged));
      } else if (b.op === "del") {
        await redis("HDEL", HASH, id);
      } else {
        return res.status(400).json({ error: "bad op" });
      }
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
