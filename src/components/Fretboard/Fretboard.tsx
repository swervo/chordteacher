"use client";

import type { ChordDefinition, StringNumber, StringStates } from "@/types/chord";
import { useTheme } from "@/lib/useTheme";

const NUM_FRETS = 5;
const STRINGS_LR: StringNumber[] = [6, 5, 4, 3, 2, 1];

const STRING_W = 52;
const FRET_H = 56;
const PAD_H = 32;
const NUT_Y = 80;  // extra space for full-size dots above nut
const PAD_B = 24;
const DOT_R = 15;  // single radius used everywhere

const WIDTH = PAD_H * 2 + (STRINGS_LR.length - 1) * STRING_W;
const HEIGHT = NUT_Y + NUM_FRETS * FRET_H + PAD_B;

const STRING_THICKNESS: Record<StringNumber, number> = {
  6: 3.2, 5: 2.4, 4: 1.8, 3: 1.3, 2: 0.9, 1: 0.6,
};

const STRING_LABELS: Record<StringNumber, string> = {
  6: "E", 5: "A", 4: "D", 3: "G", 2: "B", 1: "e",
};

const OPEN_MIDI: Record<StringNumber, number> = {
  6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64,
};

const NOTE_MIDI: Record<string, number> = {
  C: 60, "C#": 61, Db: 61, D: 62, "D#": 63, Eb: 63,
  E: 64, F: 65, "F#": 66, Gb: 66, G: 67, "G#": 68,
  Ab: 68, A: 69, "A#": 70, Bb: 70, B: 71,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SEMITONE_COLORS: Record<number, string> = {
  0:  "#ef4444",
  4:  "#3b82f6",
  3:  "#8b5cf6",
  7:  "#22c55e",
  11: "#a855f7",
  10: "#f97316",
  2:  "#f59e0b",
  5:  "#f59e0b",
  9:  "#f59e0b",
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

// Shared note dot — used above nut (open strings) and on frets
function NoteCircle({ cx, cy, fill, label, onClick }: {
  cx: number; cy: number; fill: string; label: string;
  onClick?: () => void;
}) {
  const fontSize = label.length > 2 ? 8 : label.length > 1 ? 9 : 11;
  return (
    <g onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      <circle cx={cx} cy={cy} r={DOT_R} fill={fill} />
      <text
        x={cx} y={cy + 4}
        textAnchor="middle" fontSize={fontSize}
        fill="white" fontWeight="bold" fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
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
  const { isDark } = useTheme();

  const C = isDark ? {
    nut:          "#e5e7eb",
    fret:         "#4b5563",
    marker:       "#374151",
    string:       "#9ca3af",
    stringMuted:  "#374151",
    label:        "#6b7280",
    openStroke:   "#6b7280",
    dashStroke:   "#4b5563",
    wrongFill:    "#7f1d1d",
  } : {
    nut:          "#1f2937",
    fret:         "#d1d5db",
    marker:       "#e5e7eb",
    string:       "#6b7280",
    stringMuted:  "#e5e7eb",
    label:        "#9ca3af",
    openStroke:   "#9ca3af",
    dashStroke:   "#d1d5db",
    wrongFill:    "#fca5a5",
  };

  const canonicalFret: Record<StringNumber, number | null> = {} as Record<StringNumber, number | null>;
  for (const f of chord.fingering) {
    canonicalFret[f.string as StringNumber] = f.muted ? null : (f.fret ?? 0);
  }

  // Y position for the above-nut indicator row
  const indicatorY = NUT_Y - DOT_R - 6;

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
            stroke={i === 0 ? C.nut : C.fret}
            strokeWidth={i === 0 ? 5 : 1}
          />
        ))}

        {/* Fret position markers */}
        {[3, 5].map((fret) => (
          <circle
            key={`marker-${fret}`}
            cx={WIDTH / 2}
            cy={NUT_Y + (fret - 0.5) * FRET_H}
            r={4} fill={C.marker}
          />
        ))}

        {/* String lines */}
        {STRINGS_LR.map((s) => (
          <line
            key={`string-${s}`}
            x1={stringX(s)} y1={NUT_Y}
            x2={stringX(s)} y2={NUT_Y + NUM_FRETS * FRET_H}
            stroke={stringStates[s].kind === "muted" ? C.stringMuted : C.string}
            strokeWidth={STRING_THICKNESS[s]}
          />
        ))}

        {/* String name labels */}
        {STRINGS_LR.map((s) => (
          <text
            key={`label-${s}`}
            x={stringX(s)} y={NUT_Y - DOT_R * 2 - 12}
            textAnchor="middle" fontSize={12}
            fill={C.label} fontFamily="monospace"
          >
            {STRING_LABELS[s]}
          </text>
        ))}

        {/* Above-nut indicators */}
        {STRINGS_LR.map((s) => {
          const state = stringStates[s];
          const x = stringX(s);
          const y = indicatorY;

          // Fretted note placed (fret > 0): dashed ○ — click to clear
          if (state.kind === "fret" && state.fret > 0) {
            return (
              <g key={`ind-${s}`} className="cursor-pointer" onClick={() => onToggleOpenMute(s)}>
                <circle cx={x} cy={y} r={DOT_R} fill="none" stroke={C.dashStroke} strokeWidth={1.5} strokeDasharray="4 2" />
                <circle cx={x} cy={y} r={DOT_R} fill="transparent" />
              </g>
            );
          }

          // Muted: show ×
          if (state.kind === "muted") {
            return (
              <g key={`ind-${s}`} className="cursor-pointer" onClick={() => onToggleOpenMute(s)}>
                <circle cx={x} cy={y} r={DOT_R} fill="none" stroke={C.label} strokeWidth={1.5} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fill={C.label} fontWeight="bold">×</text>
              </g>
            );
          }

          // Selected open (fret:0): rendered by the note dots section below — show nothing here
          if (state.kind === "fret" && state.fret === 0) return null;

          // Unselected open: plain ○
          return (
            <g key={`ind-${s}`} className="cursor-pointer" onClick={() => onToggleOpenMute(s)}>
              <circle cx={x} cy={y} r={DOT_R} fill="none" stroke={C.openStroke} strokeWidth={1.5} />
              <circle cx={x} cy={y} r={DOT_R} fill="transparent" />
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

        {/* Note dots — fretted (fret > 0) and selected open (fret === 0) */}
        {STRINGS_LR.map((s) => {
          const state = stringStates[s];
          if (state.kind !== "fret") return null;

          const x = stringX(s);
          const y = state.fret === 0 ? indicatorY : fretMidY(state.fret);
          const isCorrect = canonicalFret[s] === state.fret;
          const fill = isCorrect ? colorForStringFret(chord.root, s, state.fret) : C.wrongFill;
          const label = isCorrect ? noteNameAtFret(s, state.fret) : "✗";

          return (
            <NoteCircle
              key={`note-${s}`}
              cx={x} cy={y}
              fill={fill} label={label}
              onClick={state.fret === 0 ? () => onToggleOpenMute(s) : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
