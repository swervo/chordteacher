# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # ESLint
```

There are no tests. The build is the primary way to catch type errors.

## Architecture

A Next.js App Router quiz app. The quiz page is at `/quiz/[grade]` and is entirely client-side (the `QuizController` is wrapped in `dynamic(..., { ssr: false })` to avoid hydration issues from `Math.random()` and `Tone.js`).

### Data flow

1. **Chord data** lives in `src/data/chords-grade[1-4].json` as compact tab strings in E-A-D-G-B-e order (e.g. `"x-0-2-1-2-0"`). `src/data/index.ts` parses these into `StringFingering[]` at load time via `tabToFingering()`.

2. **Quiz state** is managed in `QuizController` with `useReducer`. The state holds a `StringStates` map (one `StringState` per string: `open | muted | { kind: "fret", fret: N }`). Every note placement auto-validates.

3. **Validation** (`src/lib/validation.ts`) compares the student's `StringStates` directly against `chord.fingering` from the JSON — it does not use Tonal for validation. Each string is checked: correct fret, open when required, or muted when required.

4. **Fretboard** (`src/components/Fretboard/Fretboard.tsx`) is an HTML component (not SVG). It computes note names and interval colours from `OPEN_MIDI` + `NOTE_MIDI` tables inline — no Tonal dependency. Colours are keyed by semitone distance from root.

5. **Theory panel** (`src/components/TheoryPanel/TheoryPanel.tsx`) uses Tonal (`getChordNotes`, `getParentScaleNotes` from `src/lib/theory.ts`) to get scale and chord notes, then applies the same semitone arithmetic as the fretboard for interval labels. A note gets a ✓ when its pitch class appears in a correctly-placed note per the canonical fingering.

6. **Audio** (`src/lib/audio.ts` + `src/components/AudioEngine/AudioEngine.tsx`) uses Tone.js, loaded lazily client-side only. `strumChord` staggers notes by 30ms for a realistic strum feel.

### Key types (`src/types/chord.ts`)

- `StringNumber` — 1 (high e) to 6 (low E)
- `StringState` — `open | muted | { kind: "fret", fret: number }`
- `ChordDefinition.fingering` — generated from `tab` at load time, never stored in JSON

### Adding chords

Add a line to the relevant `src/data/chords-grade[N].json`:
```json
{ "id": "amaj7-grade2", "name": "Amaj7", "root": "A", "quality": "maj7", "grade": 2, "syllabus": "LCM", "tab": "x-0-2-1-2-0" }
```
Tab is E-A-D-G-B-e order, `x` = muted, digits = fret numbers.

The `quality` field must match a Tonal.js chord type string (used by the theory panel): `"M"` for major, `"m7"`, `"maj7"`, `"sus2"`, `"sus4"`, `"6"`, `"add9"`, `"7"` etc.

### Versioning

The app version is displayed in the bottom-right corner of every page. It lives in `src/lib/version.ts`. **Bump the version number before each commit, then push immediately after — Vercel deploys on push.** Always separate bug fixes and features into distinct commits — don't bundle them together. Use judgement on the increment: +0.01 for small fixes or tweaks, +0.1 for meaningful features, +1.0 for major milestones.

### Deployment

Hosted on Vercel. Push to `main` deploys automatically. The repo is at `github.com/swervo/chordteacher`.
