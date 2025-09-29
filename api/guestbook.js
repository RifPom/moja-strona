// Ulotna "baza" w pamięci
globalThis.__GUESTBOOK = globalThis.__GUESTBOOK || [];

// Pomocnik do czytania body (JSON + x-www-form-urlencoded)
async function readBody(req) {
  let raw = "";
  for await (const c of req) raw += c;
  const ct = (req.headers["content-type"] || "").toLowerCase();

  if (ct.includes("application/json")) {
    try { return JSON.parse(raw || "{}"); } catch { return {}; }
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ items: [...globalThis.__GUESTBOOK].reverse() });
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const name = (body.name || "").toString().slice(0, 50);
    const message = (body.message || "").toString().slice(0, 200);

    if (!name || !message) {
      return res.status(400).json({ ok: false, error: "Podaj name i message" });
    }

    const entry = { id: Date.now(), name, message };
    globalThis.__GUESTBOOK.push(entry);
    return res.status(201).json({ ok: true, item: entry });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
