"use client";

import type { ChordDefinition, StringNumber, StringStates } from "@/types/chord";

const NUM_FRETS = 5;
const STRINGS_LR: StringNumber[] = [6, 5, 4, 3, 2, 1];

const STRING_W = 52;
const FRET_H = 56;
const PAD_H = 32;
const NUT_Y = 72;
const PAD_B = 24;

const WIDTH = PAD_H * 2 + (STRINGS_LR.length - 1) * STRING_W;
const HEIGHT = NUT_Y + NUM_FRETS * FRET_H + PAD_B;

const STRING_THICKNESS: Record<StringNumber, number> = {
  6: 3.2, 5: 2.4, 4: 1.8, 3: 1.3, 2: 0.9, 1: 0.6,
};

const STRING_LABELS: Record<StringNumber, string> = {
  6: "E", 5: "A", 4: "D", 3: "G", 2: "B", 1: "e",
};

// Semitone offsets from open string to compute interval vs root
const OPEN_MIDI: Record<StringNumber, number> = {
  6: 40, // E2
  5: 45, // A2
  4: 50, // D3
  3: 55, // G3
  2: 59, // B3
  1: 64, // E4
};

// Root note name → midi value (octave 4, just for semitone comparison)
const NOTE_MIDI: Record<string, number> = {
  C: 60, "C#": 61, Db: 61, D: 62, "D#": 63, Eb: 63,
  E: 64, F: 65, "F#": 66, Gb: 66, G: 67, "G#": 68,
  Ab: 68, A: 69, "A#": 70, Bb: 70, B: 71,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Interval colours keyed by semitone distance from root (for dot background)
const SEMITONE_COLORS: Record<number, string> = {
  0:  "#ef4444", // R
  4:  "#3b82f6", // maj 3
  3:  "#8b5cf6", // min 3
  7:  "#22c55e", // 5
  11: "#a855f7", // maj7
  10: "#f97316", // b7
  2:  "#f59e0b", // 2 / 9
  5:  "#f59e0b", // 4
  9:  "#f59e0b", // 6
};

function noteNameAtFret(string: StringNumber, fret: number): string {
  return NOTE_NAMES[(OPEN_MIDI[string] + fret) % 12];
}

function colorForStringFret(root: string, string: StringNumber, fret: number): string {
  const rootMidi = NOTE_MIDI[root];
  if (rootMidi === undefined) return "#6b7280";
  const semitones = ((OPEN_MIDI[string] + fret - rootMidi) % 12 + 12) % 12;
  return SEMITONE_COLORS[semitones] ?? "#6b7280";
}

function stringX(s: StringNumber): number {
  return PAD_H + STRINGS_LR.indexOf(s) * STRING_W;
}

function fretMidY(fret: number): number {
  return NUT_Y + (fret - 0.5) * FRET_H;
}

interface FretboardProps {
  chord: ChordDefinition;
  stringStates: StringStates;
  onFretClick: (string: StringNumber, fret: number) => void;
  onToggleOpenMute: (string: StringNumber) => void;
}

export default function Fretboard({
  chord, stringStates, onFretClick, onToggleOpenMute,
}: FretboardProps) {
  // Build a lookup of which fret is canonical for each string
  const canonicalFret: Record<StringNumber, number | null> = {} as Record<StringNumber, number | null>;
  for (const f of chord.fingering) {
    canonicalFret[f.string as StringNumber] = f.muted ? null : (f.fret ?? 0);
  }

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-sm"
        style={{ touchAction: "none" }}
      >
        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={PAD_H} y1={NUT_Y + i * FRET_H}
            x2={PAD_H + (STRINGS_LR.length - 1) * STRING_W} y2={NUT_Y + i * FRET_H}
            stroke={i === 0 ? "#e5e7eb" : "#4b5563"}
            strokeWidth={i === 0 ? 5 : 1}
          />
        ))}

        {/* Fret position markers */}
        {[3, 5].map((fret) => (
          <circle
            key={`marker-${fret}`}
            cx={WIDTH / 2}
            cy={NUT_Y + (fret - 0.5) * FRET_H}
            r={4} fill="#374151"
          />
        ))}

        {/* String lines */}
        {STRINGS_LR.map((s) => (
          <line
            key={`string-${s}`}
            x1={stringX(s)} y1={NUT_Y}
            x2={stringX(s)} y2={NUT_Y + NUM_FRETS * FRET_H}
            stroke={stringStates[s].kind === "muted" ? "#374151" : "#9ca3af"}
            strokeWidth={STRING_THICKNESS[s]}
          />
        ))}

        {/* String name labels */}
        {STRINGS_LR.map((s) => (
          <text
            key={`label-${s}`}
            x={stringX(s)} y={NUT_Y - 50}
            textAnchor="middle" fontSize={12}
            fill="#6b7280" fontFamily="monospace"
          >
            {STRING_LABELS[s]}
          </text>
        ))}

        {/* ○ / × / coloured open-dot indicators above nut */}
        {STRINGS_LR.map((s) => {
          const state = stringStates[s];
          const x = stringX(s);
          const y = NUT_Y - 26;

          // If fret is placed, show a plain ○ above nut that clears it on click
          if (state.kind === "fret") {
            return (
              <g key={`ind-${s}`} className="cursor-pointer" onClick={() => onToggleOpenMute(s)}>
                <circle cx={x} cy={y} r={8} fill="none" stroke="#4b5563" strokeWidth={1.5} strokeDasharray="3 2" />
                <circle cx={x} cy={y} r={14} fill="transparent" />
              </g>
            );
          }

          if (state.kind === "muted") {
            return (
              <g key={`ind-${s}`} className="cursor-pointer" onClick={() => onToggleOpenMute(s)}>
                <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fill="#6b7280" fontWeight="bold">×</text>
                <rect x={x - 12} y={y - 12} width={24} height={24} fill="transparent" />
              </g>
            );
          }

          // Open string — show note name if chord tone, plain ○ otherwise
          const noteName = noteNameAtFret(s, 0);
          const isChordTone = canonicalFret[s] === 0;
          const fill = isChordTone ? colorForStringFret(chord.root, s, 0) : "none";
          const stroke = isChordTone ? "none" : "#6b7280";

          return (
            <g key={`ind-${s}`} className="cursor-pointer" onClick={() => onToggleOpenMute(s)}>
              <circle cx={x} cy={y} r={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
              {isChordTone && (
                <text
                  x={x} y={y + 3}
                  textAnchor="middle"
                  fontSize={noteName.length > 1 ? 7 : 9}
                  fill="white" fontWeight="bold" fontFamily="sans-serif"
                >
                  {noteName}
                </text>
              )}
              <circle cx={x} cy={y} r={14} fill="transparent" />
            </g>
          );
        })}

        {/* Clickable fret hit areas */}
        {STRINGS_LR.map((s) =>
          Array.from({ length: NUM_FRETS }, (_, fi) => {
            const fret = fi + 1;
            return (
              <rect
                key={`hit-${s}-${fret}`}
                x={stringX(s) - STRING_W / 2}
                y={NUT_Y + fi * FRET_H + 2}
                width={STRING_W}
                height={FRET_H - 4}
                fill="transparent"
                className="cursor-pointer hover:fill-white/5"
                onClick={() => onFretClick(s, fret)}
              />
            );
          })
        )}

        {/* Fretted note dots */}
        {STRINGS_LR.map((s) => {
          const state = stringStates[s];
          if (state.kind !== "fret") return null;

          const x = stringX(s);
          const y = fretMidY(state.fret);
          const noteName = noteNameAtFret(s, state.fret);
          const isCorrect = canonicalFret[s] === state.fret;
          const fill = isCorrect
            ? colorForStringFret(chord.root, s, state.fret)
            : "#7f1d1d";
          const fontSize = noteName.length > 1 ? 9 : 11;

          return (
            <g key={`note-${s}`}>
              <circle cx={x} cy={y} r={15} fill={fill} />
              <text
                x={x} y={y + 4}
                textAnchor="middle" fontSize={fontSize}
                fill="white" fontWeight="bold" fontFamily="sans-serif"
              >
                {isCorrect ? noteName : "✗"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
