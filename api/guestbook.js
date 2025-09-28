// Pseudo-baza w pamięci (ulotna, resetuje się po restarcie funkcji)
globalThis.__GUESTBOOK = globalThis.__GUESTBOOK || [];

export default function handler(req, res) {
  if (req.method === "GET") {
    // zwróć wpisy w kolejności od najnowszych
    return res.status(200).json({ items: globalThis.__GUESTBOOK.slice().reverse() });
  }

  if (req.method === "POST") {
    const { name, message } = req.body || {};
    if (!name || !message) {
      return res.status(400).json({ error: "Podaj name i message" });
    }

    const entry = {
      id: Date.now(),
      name: String(name).slice(0, 50),
      message: String(message).slice(0, 200)
    };

    globalThis.__GUESTBOOK.push(entry);
    return res.status(201).json(entry);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
