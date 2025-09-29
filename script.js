/* script.js — wersja z diagnostyką (hearts + guestbook) */
(() => {
  "use strict";

  // --- małe helpery do logowania ---
  const TAG = "[Guestbook]";
  const log  = (...a) => console.log(TAG, ...a);
  const warn = (...a) => console.warn(TAG, ...a);
  const error = (...a) => console.error(TAG, ...a);

  // globalne przechwytywanie błędów
  window.addEventListener("error", (e) => error("window.error:", e.message, e.filename + ":" + e.lineno));
  window.addEventListener("unhandledrejection", (e) => error("unhandledrejection:", e.reason));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // --- personalizacja nagłówka ---
    const LOVED_ONE = "Sylwia";
    document.querySelectorAll(".name").forEach(el => (el.textContent = LOVED_ONE));

    // --- licznik odwiedzin ---
    try {
      const KEY = "visits";
      const visits = Number(localStorage.getItem(KEY) || 0) + 1;
      localStorage.setItem(KEY, String(visits));
      const el = document.getElementById("visitCount");
      if (el) el.textContent = visits.toLocaleString("pl-PL");
    } catch (e) {
      warn("localStorage niedostępny:", e);
    }

    // --- data „dziś” ---
    const todayEl = document.getElementById("today");
    if (todayEl) {
      const updateNow = () => todayEl.textContent = new Date().toLocaleString("pl-PL", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      updateNow();
      setInterval(updateNow, 60_000);
    }

    // --- serduszka ---
    const heartsLayer = document.getElementById("hearts");
    const btn = document.getElementById("heartBtn");
    if (!heartsLayer) warn("#hearts nie znaleziony");
    if (!btn) warn("#heartBtn nie znaleziony");
    btn?.addEventListener("click", () => burstHearts(28, heartsLayer));

    // --- księga gości ---
    const form = document.getElementById("guestForm");
    const list = document.getElementById("guestList");
    if (!form || !list) {
      warn("Brak #guestForm lub #guestList — pomijam inicjalizację księgi.");
      return;
    }

    // załaduj wpisy na starcie
    loadGuestbook(list);

    // obsługa wysyłki
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.name = String(payload.name || "").trim();
      payload.message = String(payload.message || "").trim();
      if (!payload.name || !payload.message) {
        alert("Wpisz imię i wiadomość 🙂");
        return;
      }

      log("Wysyłam POST /api/guestbook z payload:", payload);
      const t0 = Date.now();
      try {
        const r = await fetch("/api/guestbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const ms = Date.now() - t0;
        let data = null;
        try { data = await r.clone().json(); } catch { /* może być pusto/nie-JSON */ }

        log("Odpowiedź POST", { status: r.status, ms, data });
        if (!r.ok) {
          alert((data && data.error) || "Nie udało się dodać wpisu 😢 (szczegóły w konsoli)");
          return;
        }

        form.reset();
        await loadGuestbook(list);
      } catch (e) {
        error("Błąd przy POST /api/guestbook:", e);
        alert("Błąd sieci podczas dodawania wpisu.");
      }
    });
  }

  // --- funkcje pomocnicze ---

  async function loadGuestbook(listEl) {
    log("GET /api/guestbook (no-store)...");
    const t0 = Date.now();
    try {
      const r = await fetch("/api/guestbook", { cache: "no-store" });
      const ms = Date.now() - t0;
      const data = await r.json().catch(() => ({}));
      log("Odpowiedź GET", { status: r.status, ms, items: (data.items || []).length });

      listEl.innerHTML = "";
      (data.items || []).forEach((entry) => {
        const li = document.createElement("li");
        const when = entry.id ? new Date(entry.id).toLocaleTimeString("pl-PL") + " — " : "";
        li.textContent = `${when}${entry.name}: ${entry.message}`;
        listEl.appendChild(li);
      });
    } catch (e) {
      error("Błąd przy GET /api/guestbook:", e);
    }
  }

  function burstHearts(n = 16, layer) {
    if (!layer) return;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    for (let i = 0; i < n; i++) {
      const heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      heart.setAttribute("viewBox", "0 0 24 24");
      heart.classList.add("heart");

      const x = Math.random() * vw;
      const y = vh + Math.random() * 120;
      heart.style.setProperty("--x",
