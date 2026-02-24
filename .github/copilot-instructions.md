## Project Overview
This is a Next.js project to help beginners learn guitar. It includes practice exercises, chord libraries, interactive lessons, etc. It works well on both desktop and mobile devices, providing a seamless learning experience. It follows modern linear.app like design patterns.

## Tech Stack
- **Framework**: Next.js 16 with App Router (`src/app/`)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Fonts**: Geist Sans & Geist Mono (via `next/font/google`)
- **Audio**: Web Audio API (no external audio files)
- **Graphics**: Programmatic SVG generation (no image assets for chords)
- **React**: v19 with hooks (`useState`, `useEffect`, `useCallback`)
- **Import alias**: `@/*` → `./src/*`

## Project Structure
```
src/
├── app/
│   ├── layout.tsx            # Root layout with PWA meta, fonts, theme-color
│   ├── page.tsx              # Landing page (hero, features, coming soon)
│   ├── globals.css           # Tailwind import, CSS variables, theme
│   └── chords/
│       └── page.tsx          # Chord selection & drill UI (5-phase state machine)
├── components/               # Reusable UI components
│   ├── ...
│   ├── PatternVisualizer.tsx # Strum pattern visualizer (D/u/rest)
│   ├── PickingPatternVisualizer.tsx # Fingerpicking/arpeggio pattern visualizer (PIMA + strings)
│   ├── RiffDiagram.tsx       # Tab-style riff notation
│   ├── ...
├── data/
│   └── chords.json           # Chord definitions (16 chords: G, D, C, E, A, Am, Em, Dm, G7, D7, A7, C7, E7, Am7, Dm7, B7)
└── utils/
    ├── audio.ts              # Web Audio API wrapper (initAudio, playBeep)
    ├── chordSvg.ts           # SVG chord diagram generator (createChordSVG)
    └── useWakeLock.ts        # Screen Wake Lock hook for practice sessions
```

## Key Pages

### Home Page (`/`)
- Hero section with animated badge, headline, and CTA buttons
- Feature cards grid highlighting chord practice, focused training, mobile support
- "Coming Soon" section: Practice Session Builder, Finger Gym, Song Follow-Along, Beat Sync
- Uses `Navigation`, `FeatureCard`, `Badge`, `Button`, `StatCard`, `Footer` components

### Chord Practice Page (`/chords`)
A 5-phase state machine:
1. **select** — Grid of 16 chord diagrams; user picks 2–8 chords; sticky selection bar with removable pills
2. **ready** — Fullscreen dark overlay showing selected chords with "Start Drill" button; initializes audio & wake lock
3. **prep** — 5-second countdown with audio beeps (440Hz); "Get your guitar ready!" message
4. **drill** — 60-second timed session; chord diagrams in adaptive grid; beeps in last 5 seconds; "End Session" button
5. **finished** — "Drill Complete!" screen with restart option; wake lock released

## Reusable Components

You must use existing reusable components where applicable. If you need a new component, create it in `src/components/` and follow the existing patterns:
- Define a clear props interface
- Use Tailwind CSS for styling (no inline styles)
- Use variant patterns for different styles (e.g., `primary`, `secondary` for buttons)
- For icons, use Heroicons lib instead of raw SVGs or images
- Ensure components are flexible and reusable across different pages

## Utility Functions

- **`initAudio()`** — Creates/resumes a singleton AudioContext (iOS/Safari compatible via `webkitAudioContext` fallback). Must be called from a user gesture.
- **`playBeep(freq, duration)`** — Plays an oscillator tone with gain envelope. Handles suspended context.
- **`createChordSVG(chord, isLarge?)`** — Returns SVG markup string for a chord diagram. `isLarge` flag for drill-mode sizing.
- **`useWakeLock()`** — React hook returning `{ isSupported, isActive, requestWakeLock, releaseWakeLock }`. Auto-re-requests on tab refocus.

If necessary, you can add more utility functions in `src/utils/`, but keep them focused and reusable.

## Data Schemas

### Chord Schema (`data/chords.json`)

```jsonc
{
  "chords": [
    {
      "name": "G",                          // Display name on the diagram
      "fingers": [[6, 3, 3], [5, 2, 2]],   // [stringNumber, fretNumber, fingerNumber][]
      "muted": [6],                          // Strings NOT played (shown as × above nut)
      "open": [4, 3, 2]                     // Strings played open (shown as ○ above nut)
    }
  ]
}
```

**`fingers` tuple: `[string, fret, finger]`**
- `string`: 1-6 (1 = high E / thinnest, 6 = low E / thickest)
- `fret`: 1-based fret position on the neck
- `finger`: 1 = index, 2 = middle, 3 = ring, 4 = pinky

**Rendering rules** (see `chordSvg.ts`):
- Diagram shows 5 frets. If `maxFret > 5`, a fret offset is applied and a fret number label is shown instead of the nut.
- **Barre detection**: multiple `fingers` entries sharing the same `(fret, finger)` are rendered as a single barre bar spanning those strings.
- Strings in neither `muted`, `open`, nor `fingers` are implicitly fretted (no extra marker shown).

### Strumming Pattern Schema (`data/strumming.json`)

```jsonc
{
  "patterns": [
    {
      "id": "island-strum",                   // Unique identifier
      "name": "Island Strum",                 // Display name
      "difficulty": "beginner",               // "beginner" | "intermediate"
      "description": "The classic island...", // Short description
      "ticks": ["D", null, "D", "u", null, "u", "D", "u"]  // Variable-length array (2 ticks per beat)
    }
  ]
}
```

**`ticks` array** — each measure split into eighth-note slots (2 per beat). The array length is `beatsPerMeasure × 2` and can vary by time signature:

- **4/4 time** → 8 ticks (e.g., `["D", null, "D", "u", null, "u", "D", "u"]`)
- **3/4 time** → 6 ticks (e.g., `["D", null, "D", "u", "D", "u"]`)
- **6/8 time** → 12 ticks
- **5/4 time** → 10 ticks
- Any even number of ticks is valid (minimum 2)

| Position  | Even indices (0,2,4,...) | Odd indices (1,3,5,...) |
|-----------|-------------------------|------------------------|
| Type      | Downbeats (1, 2, 3...)  | Upbeats ("+" / "and")  |
| Direction | ↓                       | ↑                      |

- `"D"` = downstroke, `"u"` = upstroke, `null` = rest/skip (shown as `·`).
- Beat labels are generated dynamically: `1 + 2 + 3 + ...` based on array length.
- Rendered by `PatternVisualizer` with color-coding: blue for D, green for u, amber when active.

### Picking Pattern Schema (in `data/songs.json` → `library.pickingPatterns`)

```jsonc
{
  "arpeggio-picking": {
    "id": "arpeggio-picking",                   // Unique identifier
    "name": "Standard Picking",                 // Display name
    "beats": [                                   // Array of beats (one per tick)
      { "strings": [5], "fingers": ["p"] },     // Beat 1: thumb plucks A string
      { "strings": [3], "fingers": ["i"] },     // Beat 2: index plucks G string
      { "strings": [2], "fingers": ["m"] },     // Beat 3: middle plucks B string
      { "strings": [1], "fingers": ["a"] },     // Beat 4: ring plucks high e string
      { "strings": [2], "fingers": ["m"] },     // Beat 5: middle plucks B string
      { "strings": [3], "fingers": ["i"] }      // Beat 6: index plucks G string
    ]
  }
}
```

**`beats` array** — each entry is a beat/tick specifying which strings are plucked:
- `strings`: Array of string numbers (1=high e, 6=low E). Multiple strings = simultaneous pluck.
- `fingers`: Optional PIMA notation for right-hand fingers (`"p"` = thumb, `"i"` = index, `"m"` = middle, `"a"` = ring).

**Rendering rules** (see `PickingPatternVisualizer`):
- Displayed as a mini-tablature: 6 horizontal string lines with colored dots at pluck positions.
- PIMA fingers are color-coded: blue (p/thumb), green (i/index), violet (m/middle), rose (a/ring).
- Active beat highlighted in amber during playback.
- Used for arpeggio/fingerpicking patterns instead of `PatternVisualizer` (which is for strumming).

**When to use picking vs strumming patterns:**
- **Strumming** (`patterns`): Chord is strummed as a whole — direction matters (D/u). Use `PatternVisualizer`.
- **Picking** (`pickingPatterns`): Individual strings are plucked in sequence — string order and finger assignment matter. Use `PickingPatternVisualizer`.
- In `songs.json` timeline measures, `patternId` can reference either a strum pattern or a picking pattern. The code checks `pickingPatterns` first to determine which visualizer to use.

## Design System

The design system is inspired by linear.app's clean, modern aesthetic:

- **Colors**: Blue primary (`blue-600`/`blue-700`), slate grays for text/borders, yellow for countdown, red for muted strings
- **Typography**: Geist font family, responsive heading sizes (3xl–7xl)
- **Layout**: Mobile-first responsive design, adaptive grids based on chord count
- **Interactions**: Scale animations on hover/active, backdrop blur on overlays, smooth transitions
- **PWA**: Web manifest, apple-web-app meta, viewport lock, installable to home screen

## Key Commands
- `npm run dev` — Start development server (localhost:3000)
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint checks

## Development Guidelines
- Use type-safe TypeScript — no `any` types
- Use Tailwind CSS for all styling — no inline styles or CSS modules
- Use Heroicons instead of raw SVGs or images in components
- Create reusable components — avoid code duplication
- Write clean, maintainable code with clear naming
- Keep data in `json` files
- Use `@/*` import alias for all project imports
- Follow existing component patterns (props interfaces, variant patterns, Tailwind class composition)
- Client components must have `"use client"` directive
- Audio must be initialized from user gestures (iOS requirement)
- For any drill practice, ensure wake lock is requested to prevent screen dimming