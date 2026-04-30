# ChordTeacher

Interactive guitar chord quiz for LCM (London College of Music) Acoustic Guitar grades 1–4.

## What it does

- Displays a chord name and an interactive fretboard
- Click frets to form the chord — note names appear on each dot, coloured by interval role
- A scale panel shows the parent scale with chord tones highlighted; each note gets a ✓ as you place it correctly
- Audio plays the chord with a realistic strum when you get it right

## Chord syllabus

| Grade | Chords |
|-------|--------|
| 1 | A, E, D7, A7, E7, B7 |
| 2 | F, Am7, Em7, Dm7, C7, G7, Cmaj7, Gmaj7, Dmaj7, Amaj7, Fmaj7 |
| 3 | Dsus2, Asus2, Fsus2, Csus4, Gsus4, Dsus4, Asus4, Esus4, Fsus4 |
| 4 | G6, A6, D6, E6, Gadd9, Aadd9, Eadd9, Cadd9, Fadd9 |

Fingering data is stored as compact tab strings in `src/data/chords-grade[1-4].json` in E-A-D-G-B-e order, e.g. `"x-0-2-1-2-0"` for Amaj7.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tonal.js](https://github.com/tonaljs/tonal) — music theory
- [Tone.js](https://tonejs.github.io) — browser audio
- [Tailwind CSS](https://tailwindcss.com)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding chords

Edit the relevant `src/data/chords-grade[N].json` file. Each chord is one line:

```json
{ "id": "amaj7-grade2", "name": "Amaj7", "root": "A", "quality": "maj7", "grade": 2, "syllabus": "LCM", "tab": "x-0-2-1-2-0" }
```

Tab order is **E-A-D-G-B-e** (low to high), digits are fret numbers, `x` is muted.
