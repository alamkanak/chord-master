# Chord Master - Guitar Learning App

## Project Overview

Chord Master is a modern, beginner-friendly guitar learning application built with Next.js, React, and Tailwind CSS. It features an interactive chord practice drill system with visual fingering diagrams, a 1-minute timed practice session, and a countdown timer to prepare for practice.

## Features Implemented ✅

### 1. **Home Page**
- Clean, modern landing page with Linear.app-style design
- Hero section with value proposition
- Three main feature cards highlighting key benefits:
  - Chord Practice: Select multiple chords for 1-minute drills
  - Focused Training: Built for beginners
  - Practice Anywhere: Mobile-responsive, PWA-ready
- "Coming Soon" section with future features:
  - Practice Session Builder
  - Finger Gym
  - Song Follow-Along
  - Beat Sync
- Responsive navigation bar with logo and call-to-action

### 2. **Chord Selection Page**
- Grid layout displaying all 16 guitar chords:
  - **Basic Chords**: G, D, C, E, A, Am, Em, Dm
  - **Seventh Chords**: G7, D7, A7, C7, E7, Am7, Dm7, B7
- Pixel-perfect SVG-based chord diagrams showing:
  - Finger placement with numbered dots (1-4)
  - Open strings (○) vs muted strings (×)
  - String lines and fret markers
- Interactive chord selection with visual feedback (blue highlighting)
- Control buttons:
  - **Clear**: Deselect all chords
  - **Random**: Generate random chord selection (2-8 chords) and start drill
  - **Start Drill**: Begin practice session (enabled when 2-8 chords selected)
- Sticky selection bar showing chosen chords with individual remove buttons
- Chord data stored in JSON for easy extensibility

### 3. **Practice Drill Features**

#### Prep Phase (5-second Countdown)
- Full-screen dark interface for focus
- Large countdown display (9xl text)
- "Get your guitar ready!" message
- Audio beeps for each second (440 Hz tone)
- Final beep at 0 seconds (880 Hz) to signal practice start

#### Drill Phase (1-minute Session)
- Large timer display (59:00 down to 00:00)
- Message: "PRACTICE TRANSITIONS BETWEEN ALL CHORDS"
- "End Session" button for early exit
- Selected chords displayed in responsive grid:
  - 2 chords: 2-column grid
  - 3-5 chords: 3-column grid
  - 6-8 chords: 4-column grid
- Large, high-contrast chord diagrams (3.5x size of selection view)
- Audio alerts in last 5 seconds (440 Hz beeps)
- Final completion sound (523 Hz) when timer reaches 0

### 4. **Technical Architecture**

#### File Structure
```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── chords/page.tsx       # Chord selection & drill UI
│   ├── layout.tsx            # Root layout with PWA meta tags
│   └── globals.css           # Global styles
├── data/
│   └── chords.json           # Chord definitions & finger positions
├── utils/
│   ├── chordSvg.ts          # SVG chord diagram generator
│   └── audio.ts             # Audio beep generation
├── components/              # Reusable components (future)
└── public/
    └── manifest.json        # PWA manifest

package.json                 # Dependencies & scripts
tsconfig.json               # TypeScript config
tailwind.config.js          # Tailwind CSS config
next.config.ts              # Next.js config
```

#### Key Technologies
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with custom design system
- **Language**: TypeScript for type safety
- **State Management**: React Hooks (useState, useEffect)
- **Graphics**: SVG-based chord diagrams (no external images)
- **Audio**: Web Audio API for beep sounds

### 5. **Chord Data Structure**

Each chord is defined with:
```typescript
{
  name: string;           // e.g., "G", "D", "Am7"
  fingers: [number, number, number][];  // [string, fret, finger] positions
  muted: number[];        // String numbers that are muted
  open: number[];         // String numbers that are open
}
```

Add new chords easily by updating `src/data/chords.json`.

### 6. **Design System & UX**

- **Color Palette**:
  - Primary: Blue (from-blue-600 to-blue-700)
  - Neutral: Slate grays for text and borders
  - Accent: Yellow for countdown numbers
  - Error states: Red for muted strings

- **Typography**:
  - Geist sans-serif font family
  - Responsive heading sizes (3xl to 6xl)
  - Clear visual hierarchy

- **Responsive Design**:
  - Mobile-first approach
  - Works on all screen sizes
  - Touch-friendly button sizing
  - Adaptive grid layouts for different chord counts

- **PWA Features**:
  - Web manifest with app icons
  - Mobile web app metadata
  - Viewport settings for full-screen capability
  - Can be installed to home screen on iPhone/Android

## Running the App

### Development
```bash
npm run dev
# App opens at http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## User Flow

1. **Home Page** → Click "Start Learning"
2. **Chord Selection** → Select 2-8 chords or click "Random"
3. **Prep Phase** → 5-second countdown to get guitar ready
4. **Drill Phase** → 1-minute timed practice with all selected chords visible
5. **Completion** → Option to end session early or wait for timer
6. Return to **Chord Selection** to practice again

## Future Enhancements Ready

The app is architected to support:

### Coming Soon Features (Placeholders Ready)
1. **Practice Session Builder**
   - Create custom multi-step practice sessions
   - Configure duration and chord sets per step
   - Track progress and statistics

2. **Finger Gym**
   - Exercises for finger strength and flexibility
   - Guided hand positioning tutorials
   - Difficulty progression

3. **Song Follow-Along**
   - Learn songs using chord progressions
   - Real-time chord display with strumming patterns
   - Tempo control

4. **Beat Sync**
   - Metronome integration
   - Multiple BPM settings
   - Different time signatures

### Architecture for Extensibility
- Modular chord SVG generation (easy to add new chords)
- Reusable audio utility functions
- Centralized timestamp/timer system
- Session state management ready for multi-step flows

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 14+)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Notes

- SVG chord diagrams render instantly (no image files)
- Lightweight bundle with optimized CSS
- Web Audio API for low-latency beep sounds
- Efficient React state updates with no unnecessary re-renders

## Mobile/PWA Instructions

### iPhone
1. Open app URL in Safari
2. Tap Share → Add to Home Screen
3. App works like native app with full-screen mode

### Android
1. Open app URL in Chrome
2. Menu → "Install app" or "Add to home screen"
3. Launches in fullscreen mode

## Code Quality

- TypeScript for type safety preventing bugs
- React best practices with hooks
- Responsive Tailwind CSS classes
- Clean component separation
- Semantic HTML structure
- Accessible button states and interactions

## Notes for Development

- **Chord Data**: Edit `src/data/chords.json` to add/modify chords
- **SVG Rendering**: `src/utils/chordSvg.ts` generates all diagrams dynamically
- **Audio Timing**: Beeps are synced with countdown and drill phases
- **State Management**: All state lives in ChordsPage component for simplicity (can be extracted to context/store later)

---

Built with ❤️ for absolute beginners learning guitar.
