// === App with diagnostics ============================================
(() => {
  const VERSION = "v1.3.1";
  const DEBUG = true;
  const log = (...a) => DEBUG && console.log("[app]", ...a);
  const warn = (...a) => DEBUG && console.warn("[app]", ...a);
  const err = (...a) => DEBUG && console.error("[app]", ...a);

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function init() {
    log("Start", VERSION);

    // 1) Imię
    const LOVED_ONE = "Sylwia";
    $$(".name").forEach((el) => (el.textContent = LOVED_ONE));

    // 2) Licznik odwiedzin
    try {
      const KEY = "visits";
      const visits = Number(localStorage.getItem(KEY) || 0) + 1;
      localStorage.setItem(KEY, String(visits));
      $("#visitCount") && ($("#visitCount").textContent = visits.toLocaleString("pl-PL"));
      log("Visits:", visits);
    } catch (e) { warn("LocalStorage?", e); }

    // 3) Data
    const today = new Date();
    $("#today") && ($("#today").textContent = today.toLocaleString("pl-PL", {
      weekday:"long", year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit"
    }));

    // 4) Serduszka
    const btn = $("#heartBtn");
    btn ? btn.addEventListener("click", () => burstHearts(28)) : warn("Brak #heartBtn");

    // 5) Księga
    setupGuestbook();
  }

  // ---------------- Hearts ----------------
  function burstHearts(n = 16) {
    const layer = $("#hearts"); if (!layer) return;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    for (let i = 0; i < n; i++) {
      const heart = document.createElementNS("http://www.w3.org/2000/svg","svg");
      heart.setAttribute("viewBox","0 0 24 24"); heart.classList.add("heart");
      const x = Math.random() * vw, y = vh + Math.random() * 120;
      heart.style.setProperty("--x", `${x}px`); heart.style.setProperty("--startY", `${y}px`);
      heart.style.left = `${x}px`; heart.style.top = `${y}px`;
      heart.style.rotate = `${(Math.random()*40-20).toFixed(0)}deg`;
      const fills = ["#fb7185","#f472b6","#f43f5e","#ef4444","#ec4899"];
      heart.innerHTML = `<path d="M12 21s-7.5-4.7-9.3-9.2C1.6 8.6 3.3 6 6.1 6c1.9 0 3 .9 3.9 2.2C10.9 6.9 12 6 13.9 6c2.8 0 4.5 2.6 3.4 5.8C19.5 16.3 12 21 12 21z" fill="${fills[Math.floor(Math.random()*fills.length)]}"/>`;
      layer.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove());
    }
  }

  // --------------- Guestbook ---------------
  function setupGuestbook() {
    const form = $("#guestForm"), list = $("#guestList");
    if (!form || !list) { warn("Brak #guestForm / #guestList"); return; }

    loadGuestbook(list);

    form.addEventListener("submit", async (e) => {
      // Jeśli JS działa, zablokuj domyślne przeładowanie i wyślij fetch.
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      log("Wysyłam payload:", payload);

      const res = await postGuestbook(payload);
      log("POST wynik:", res);

      if (!res.ok) {
        alert(res.error || "Nie udało się dodać wpisu 😢 (zobacz Console)");
        return;
      }
      form.reset();
      loadGuestbook(list);
    });

    // Funkcja testowa w konsoli
    window.debugApiPost = async (name="Test", message="Hej!") => {
      const r = await postGuestbook({ name, message });
      log("debugApiPost ->", r);
      return r;
    };
  }

  async function loadGuestbook(listEl) {
    try {
      console.time("GET /api/guestbook");
      const r = await fetch("/api/guestbook", { cache: "no-store" });
      const ct = r.headers.get("content-type") || "";
      log("GET status:", r.status, ct);
      const data = ct.includes("application/json") ? await r.json() : { items: [] };
      console.timeEnd("GET /api/guestbook");

      listEl.innerHTML = "";
      (data.items || []).forEach((e) => {
        const li = document.createElement("li");
        li.textContent = `${e.name}: ${e.message}`;
        listEl.appendChild(li);
      });
    } catch (e) { err("Błąd GET:", e); }
  }

  async function postGuestbook(payload) {
    try {
      // Najpierw JSON
      console.time("POST /api/guestbook (json)");
      let r = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const t = await r.text();
      console.timeEnd("POST /api/guestbook (json)");
      log("POST(json):", r.status, t);

      let body; try { body = JSON.parse(t); } catch { body = { raw:t }; }

      // Fallback na x-www-form-urlencoded, gdy backend krzyczy (400/415)
      if (!r.ok && (r.status === 400 || r.status === 415)) {
        console.time("POST /api/guestbook (form)");
        const formBody = new URLSearchParams(payload);
        r = await fetch("/api/guestbook", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formBody
        });
        const t2 = await r.text();
        console.timeEnd("POST /api/guestbook (form)");
        log("POST(form):", r.status, t2);
        try { body = JSON.parse(t2); } catch { body = { raw:t2 }; }
      }

      return { ok: r.ok, status: r.status, ...body };
    } catch (e) {
      err("Błąd POST:", e);
      return { ok:false, error:String(e) };
    }
  }

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else { init(); }
})();
