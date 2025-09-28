// ← możesz tu zmienić imię, jeśli chcesz bawić się bez edycji HTML
const LOVED_ONE = "Sylwia";

// Ustawiamy imię w nagłówku (jeśli ktoś zmieni w HTML, to i tak nie przeszkadza)
document.querySelectorAll(".name").forEach(el => (el.textContent = LOVED_ONE));

// Licznik odwiedzin w localStorage
const KEY = "visits";
const visits = Number(localStorage.getItem(KEY) || 0) + 1;
localStorage.setItem(KEY, String(visits));
document.getElementById("visitCount").textContent = visits.toLocaleString("pl-PL");

// Data „dziś”
const today = new Date();
document.getElementById("today").textContent = today.toLocaleString("pl-PL", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

// Serduszka po kliknięciu
const heartsLayer = document.getElementById("hearts");
const btn = document.getElementById("heartBtn");
btn.addEventListener("click", () => burstHearts(28));

function burstHearts(n = 16){
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  for(let i=0;i<n;i++){
    const heart = document.createElementNS("http://www.w3.org/2000/svg","svg");
    heart.setAttribute("viewBox","0 0 24 24");
    heart.classList.add("heart");
    const x = Math.random() * vw;                 // losowa pozycja startowa po szerokości
    const y = vh + Math.random()*120;             // trochę poniżej ekranu
    heart.style.setProperty("--x", `${x}px`);
    heart.style.setProperty("--startY", `${y}px`);
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.rotate = `${(Math.random()*40-20).toFixed(0)}deg`;

    // różne odcienie różu/czerwieni
    const fills = ["#fb7185", "#f472b6", "#f43f5e", "#ef4444", "#ec4899"];
    const fill = fills[Math.floor(Math.random()*fills.length)];

    heart.innerHTML = `
      <path d="M12 21s-7.5-4.7-9.3-9.2C1.6 8.6 3.3 6 6.1 6c1.9 0 3 .9 3.9 2.2C10.9 6.9 12 6 13.9 6c2.8 0 4.5 2.6 3.4 5.8C19.5 16.3 12 21 12 21z"
            fill="${fill}"/>
    `;
    heartsLayer.appendChild(heart);
    // sprzątanie po animacji
    heart.addEventListener("animationend", () => heart.remove());
  }
}
