Testowa wersja silnika do gry Full Speed 2

Autor: Łukasz Kamiński

https://github.com/Loleus/fullspeed2

Struktura modularna gry (każdy plik to osobny moduł ES6):
- config.js – podstawowa konfiguracja silnika (parametry fizyki, świat, itp.)
- main.js – inicjalizacja, pętla gry, obsługa canvas, start gry
- car.js – logika auta, fizyka, tworzenie instancji samochodu (w przyszłości: klasa Car dla wielu aut)
- world.js – logika świata, generowanie toru, kolizje, detekcja nawierzchni, kamera
- hud.js – rysowanie liczników i wskaźników (HUD)
- input.js – obsługa wejścia z klawiatury
- render.js – rysowanie auta i świata na canvasie

Każdy moduł odpowiada za wyraźnie wydzieloną część logiki gry.
W index.html należy użyć <script type="module">.
https://loleus.github.io/fullspeed2/
Wersja modularna ułatwia rozbudowę silnika (np. wiele aut, AI, multiplayer, różne konfiguracje pojazdów).
