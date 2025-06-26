# Full Speed 2

## Struktura modularna gry (każdy plik to osobny moduł ES6):

- **config.js** – podstawowa konfiguracja silnika (parametry fizyki, świat, itp.)
- **main.js** – inicjalizacja, pętla gry, obsługa canvas, start gry
- **car.js** – logika auta, fizyka, tworzenie instancji samochodu (w przyszłości: klasa Car dla wielu aut)
- **carPhysics.js** – model fizyki pojazdu
- **world.js** – logika świata, generowanie toru, kolizje, detekcja nawierzchni, kamera
- **worldPhysics.js** – fizyka kolizji świata: granice, odbicia, wypychanie, wydzielone z world.js
- **hud.js** – rysowanie liczników i wskaźników (HUD)
- **input.js** – obsługa wejścia z klawiatury
- **render.js** – rysowanie auta i świata na canvasie
- **svgWorldLoader.js** – ładowanie SVG, pozycja startowa, obrysy przeszkód (polygony) z mapy
- **obstacles.js** – precyzyjna kolizja auta z przeszkodami (SAT, wypychanie, ślizganie)

Każdy moduł odpowiada za wyraźnie wydzieloną część logiki gry.
W index.html należy użyć `<script type="module">`.

Wersja modularna ułatwia rozbudowę silnika (np. wiele aut, AI, multiplayer, różne konfiguracje pojazdów).
