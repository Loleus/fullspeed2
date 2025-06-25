# Struktura Projektu Full Speed 2

## Organizacja katalogów

```
fullspeed2/
├── index.html                 # Główny plik HTML
├── README.md                  # Dokumentacja projektu
├── PROJECT_STRUCTURE.md       # Ten plik - opis struktury
├── assets/                    # Zasoby statyczne
│   ├── images/               # Obrazy i tekstury
│   │   ├── car_O.png
│   │   ├── car_X.png
│   │   └── fullspeed2.jpg
│   ├── scenes/               # Pliki scen i map
│   │   └── SCENE_1.svg
│   └── styles/               # Style CSS
│       └── styles.css
└── src/                      # Kod źródłowy JavaScript
    ├── main.js               # Punkt wejścia aplikacji
    ├── config/               # Konfiguracja gry
    │   └── gameConfig.js     # Parametry silnika gry
    ├── core/                 # Rdzeń aplikacji
    │   ├── gameLoop.js       # Pętla gry, FPS, timing
    │   └── utils.js          # Funkcje pomocnicze matematyczne
    ├── entities/             # Encje gry
    │   ├── car/              # Logika auta
    │   │   ├── car.js        # Tworzenie i zarządzanie autem
    │   │   ├── carPhysics.js # Fizyka auta
    │   │   └── carRenderer.js # Renderowanie auta
    │   └── obstacles/        # Przeszkody
    │       └── obstacles.js  # Kolizje z przeszkodami
    ├── world/                # Świat gry
    │   ├── world.js          # Zarządzanie światem
    │   ├── worldPhysics.js   # Fizyka świata
    │   └── svgWorldLoader.js # Ładowanie map z SVG
    ├── input/                # Wejście użytkownika
    │   └── input.js          # Obsługa klawiatury
    ├── render/               # Renderowanie
    │   ├── render.js         # Główny renderer
    │   └── hud.js            # Interfejs użytkownika (HUD)
    └── physics/              # Fizyka
        └── physicsUtils.js   # Funkcje pomocnicze fizyki
```

## Modularyzacja

### 1. **Core** (`src/core/`)
- **gameLoop.js**: Klasa zarządzająca pętlą gry, FPS i timingiem
- **utils.js**: Funkcje pomocnicze matematyczne (wektory, clamp, etc.)

### 2. **Entities** (`src/entities/`)
- **car/**: Wszystko związane z autem
  - `car.js`: Logika biznesowa auta
  - `carPhysics.js`: Fizyka pojazdu
  - `carRenderer.js`: Renderowanie auta
- **obstacles/**: Przeszkody i kolizje

### 3. **World** (`src/world/`)
- `world.js`: Zarządzanie światem gry
- `worldPhysics.js`: Fizyka świata
- `svgWorldLoader.js`: Ładowanie map z plików SVG

### 4. **Render** (`src/render/`)
- `render.js`: Główny system renderowania
- `hud.js`: Interfejs użytkownika

### 5. **Input** (`src/input/`)
- `input.js`: Obsługa wejścia użytkownika

### 6. **Physics** (`src/physics/`)
- `physicsUtils.js`: Wspólne funkcje fizyki

### 7. **Config** (`src/config/`)
- `gameConfig.js`: Konfiguracja parametrów gry

## Korzyści z nowej struktury

1. **Separacja odpowiedzialności**: Każdy moduł ma jasno określoną rolę
2. **Łatwość utrzymania**: Kod jest podzielony na logiczne części
3. **Reużywalność**: Moduły mogą być łatwo wykorzystane w innych częściach
4. **Skalowalność**: Łatwo dodawać nowe funkcjonalności
5. **Testowanie**: Każdy moduł można testować niezależnie
6. **Czytelność**: Struktura jest intuicyjna i łatwa do zrozumienia

## Importy

Wszystkie importy zostały zaktualizowane, aby odzwierciedlać nową strukturę katalogów. Ścieżki względne są używane konsekwentnie w całym projekcie. 