"use client";

import type { ChordDefinition, StringNumber, StringStates } from "@/types/chord";
import { useTheme } from "@/lib/useTheme";
import NoteCircle from "@/components/NoteCircle";

const NUM_FRETS = 5;
const STRINGS_LR: StringNumber[] = [6, 5, 4, 3, 2, 1];

const STRING_PX: Record<StringNumber, number> = {
  6: 3, 5: 2.5, 4: 2, 3: 1.5, 2: 1, 1: 0.5,
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
  0: "#ef4444", 4: "#3b82f6", 3: "#8b5cf6", 7: "#22c55e",
  11: "#a855f7", 10: "#f97316", 2: "#f59e0b", 5: "#f59e0b", 9: "#f59e0b",
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

interface FretboardProps {
  chord: ChordDefinition;
  stringStates: StringStates;
  onFretClick: (string: StringNumber, fret: number) => void;
  onToggleOpenMute: (string: StringNumber) => void;
}

export default function Fretboard({ chord, stringStates, onFretClick, onToggleOpenMute }: FretboardProps) {
  const { isDark } = useTheme();

  const C = isDark ? {
    nut: "#e5e7eb", fret: "#374151",
    string: "#6b7280", stringMuted: "#1e293b",
    marker: "#374151",
    openStroke: "#6b7280", dashStroke: "#4b5563",
    muteStroke: "#6b7280", wrongFill: "#7f1d1d",
    label: "#6b7280",
  } : {
    nut: "#1f2937", fret: "#e5e7eb",
    string: "#9ca3af", stringMuted: "#f3f4f6",
    marker: "#e5e7eb",
    openStroke: "#9ca3af", dashStroke: "#d1d5db",
    muteStroke: "#9ca3af", wrongFill: "#fca5a5",
    label: "#9ca3af",
  };

  // A fret position is valid if it appears in any voicing
  const validPositions = new Set(
    chord.fingerings.flatMap((fingering) =>
      fingering.filter((f) => !f.muted && f.fret !== null).map((f) => `${f.string}-${f.fret}`)
    )
  );
  const validOpenStrings = new Set(
    chord.fingerings.flatMap((fingering) =>
      fingering.filter((f) => f.fret === 0).map((f) => f.string)
    )
  );

  // Each column is equal width. Outer strings sit at 50% of col 1 and col 6.
  // The neck boundary runs from the centre of col 1 to the centre of col 6,
  // which is 5/6 of the total width, offset by half a column (1/12).
  // We achieve this by making the outer column cells half-clickable and
  // drawing the nut/fret lines using left/right border on an inner wrapper.

  return (
    <div className="w-full select-none">

      {/* Indicator row — same grid, circles centred in each column */}
      <div className="grid grid-cols-6 mb-2">
        {STRINGS_LR.map((s) => {
          const state = stringStates[s];
          const isSelectedOpen = state.kind === "fret" && state.fret === 0;
          const isMuted = state.kind === "muted";
          const isFrettedPlaced = state.kind === "fret" && state.fret > 0;

          let label = "";
          let bgColor: string | undefined;
          let borderColor: string | undefined;
          let dashed = false;

          if (isSelectedOpen) {
            const isCorrect = validOpenStrings.has(s);
            label = isCorrect ? noteNameAtFret(s, 0) : "";
            bgColor = isCorrect ? colorForStringFret(chord.root, s, 0) : undefined;
            borderColor = isCorrect ? undefined : C.dashStroke;
          } else if (isMuted) {
            label = "×";
            borderColor = C.muteStroke;
          } else if (isFrettedPlaced) {
            dashed = true;
            borderColor = C.dashStroke;
          } else {
            borderColor = C.openStroke;
          }

          return (
            <div key={s} className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-mono" style={{ color: C.label }}>{STRING_LABELS[s]}</span>
              <NoteCircle
                label={label}
                bgColor={bgColor}
                borderColor={borderColor}
                dashed={dashed}
                onClick={() => onToggleOpenMute(s)}
              />
            </div>
          );
        })}
      </div>

      {/* Nut + fret rows — nut and all fret lines use identical left/right offsets */}
      {/* Each of 6 columns is 1/6 wide; outer strings sit at col centres = 1/12 from each edge = 8.33% */}
      <div className="relative" style={{ height: 4 }}>
        <div className="absolute top-0 left-[8.33%] right-[8.33%]"
          style={{ borderTop: `5px solid ${C.nut}` }} />
      </div>

      {Array.from({ length: NUM_FRETS }, (_, fi) => {
        const fret = fi + 1;
        const isMarkerFret = fret === 3 || fret === 5;

        return (
          <div
            key={fret}
            className="relative grid grid-cols-6"
            style={{ height: 68 }}
          >
            {/* Fret line */}
            <div className="absolute bottom-0 left-[8.33%] right-[8.33%]"
              style={{ borderBottom: `1px solid ${C.fret}` }} />

            {/* Fret position marker */}
            {isMarkerFret && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: C.marker }} />
              </div>
            )}

            {STRINGS_LR.map((s) => {
              const state = stringStates[s];
              const isPlacedHere = state.kind === "fret" && state.fret === fret;
              const isCorrect = isPlacedHere && validPositions.has(`${s}-${fret}`);
              const stringColor = state.kind === "muted" ? C.stringMuted : C.string;

              return (
                <div
                  key={s}
                  className="relative flex items-center justify-center cursor-pointer hover:bg-white/5"
                  onClick={() => onFretClick(s, fret)}
                >
                  {/* String line */}
                  <div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ width: STRING_PX[s], backgroundColor: stringColor }}
                  />
                  {/* Note dot */}
                  {isPlacedHere && (
                    <NoteCircle
                      label={isCorrect ? noteNameAtFret(s, fret) : ""}
                      bgColor={isCorrect ? colorForStringFret(chord.root, s, fret) : undefined}
                      borderColor={isCorrect ? undefined : C.dashStroke}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
