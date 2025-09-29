const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      "Content-Type": "application/json",
      ...(method === "POST" ? { Prefer: "return=representation" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || res.statusText);
  return data;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const rows = await sb("GET", "/guestbook?select=id,created_at,name,message&order=created_at.desc&limit=100");
    return res.status(200).json({ items: rows });
  }
  if (req.method === "POST") {
    let raw = ""; for await (const c of req) raw += c;
    const { name = "", message = "" } = JSON.parse(raw || "{}");
    if (!name.trim() || !message.trim()) return res.status(400).json({ ok:false, error:"Podaj name i message" });
    const [inserted] = await sb("POST", "/guestbook", [{ name: name.slice(0,50), message: message.slice(0,200) }]);
    return res.status(201).json({ ok:true, item: inserted });
  }
  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok:false, error:"Method Not Allowed" });
}
