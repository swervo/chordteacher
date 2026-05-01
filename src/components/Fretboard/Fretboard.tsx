"use client";

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import type { ChordDefinition, StringNumber, StringStates } from "@/types/chord";
import { useTheme } from "@/lib/useTheme";
import NoteCircle from "@/components/NoteCircle";
import { INTERVAL_COLORS, COLOR_GRAY } from "@/lib/colors";

const NUM_FRETS = 5;
const NUM_ROWS = NUM_FRETS + 1; // row 0 = indicators, rows 1-5 = frets
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

function noteNameAtFret(string: StringNumber, fret: number): string {
  return NOTE_NAMES[(OPEN_MIDI[string] + fret) % 12];
}

function colorForStringFret(root: string, string: StringNumber, fret: number): string {
  const rootMidi = NOTE_MIDI[root];
  if (rootMidi === undefined) return COLOR_GRAY;
  const semitones = ((OPEN_MIDI[string] + fret - rootMidi) % 12 + 12) % 12;
  return INTERVAL_COLORS[semitones] ?? COLOR_GRAY;
}

export interface FretboardHandle {
  focusFirstCell: () => void;
}

interface FretboardProps {
  chord: ChordDefinition;
  stringStates: StringStates;
  onFretClick: (string: StringNumber, fret: number) => void;
  onToggleOpenMute: (string: StringNumber) => void;
  disabled?: boolean;
}

const Fretboard = forwardRef<FretboardHandle, FretboardProps>(function Fretboard(
  { chord, stringStates, onFretClick, onToggleOpenMute, disabled = false },
  ref
) {
  const { isDark } = useTheme();
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // 2D array of refs: cellRefs[row][col]
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(
    Array.from({ length: NUM_ROWS }, () => Array(STRINGS_LR.length).fill(null))
  );

  // When focusedCell changes via arrow keys, move DOM focus to the new button
  const lastFocusSource = useRef<"keyboard" | "mouse">("mouse");
  useEffect(() => {
    if (lastFocusSource.current === "keyboard" && focusedCell) {
      cellRefs.current[focusedCell.row]?.[focusedCell.col]?.focus();
    }
  }, [focusedCell]);

  // Reset focus position when chord changes
  useEffect(() => {
    setFocusedCell(null);
  }, [chord.id]);

  useImperativeHandle(ref, () => ({
    focusFirstCell: () => {
      setFocusedCell(null);
      cellRefs.current[0]?.[0]?.focus();
    },
  }));

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    let nextRow = row;
    let nextCol = col;

    switch (e.key) {
      case "ArrowRight": e.preventDefault(); nextCol = Math.min(col + 1, STRINGS_LR.length - 1); break;
      case "ArrowLeft":  e.preventDefault(); nextCol = Math.max(col - 1, 0); break;
      case "ArrowDown":  e.preventDefault(); nextRow = Math.min(row + 1, NUM_FRETS); break;
      case "ArrowUp":    e.preventDefault(); nextRow = Math.max(row - 1, 0); break;
      default: return;
    }

    lastFocusSource.current = "keyboard";
    setFocusedCell({ row: nextRow, col: nextCol });
  }, []);

  const C = isDark ? {
    nut: "#e5e7eb", fret: "#374151",
    string: "#6b7280", stringMuted: "#1e293b",
    marker: "#374151",
    openStroke: "#6b7280", dashStroke: "#4b5563",
    muteStroke: "#6b7280",
    label: "#6b7280",
  } : {
    nut: "#1f2937", fret: "#e5e7eb",
    string: "#9ca3af", stringMuted: "#f3f4f6",
    marker: "#e5e7eb",
    openStroke: "#9ca3af", dashStroke: "#d1d5db",
    muteStroke: "#9ca3af",
    label: "#9ca3af",
  };

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

  return (
    <div className="w-full select-none" role="grid" aria-label="Guitar fretboard">

      {/* Indicator row */}
      <div className="grid grid-cols-6 mb-2" role="row">
        {STRINGS_LR.map((s, col) => {
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

          const stateDesc = isSelectedOpen ? "open" : isMuted ? "muted" : "unplayed";

          return (
            <div key={s} role="gridcell" className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-mono" style={{ color: C.label }}>{STRING_LABELS[s]}</span>
              <button
                ref={(el) => { cellRefs.current[0][col] = el; }}
                tabIndex={!disabled && ((!focusedCell && col === 0) || (focusedCell?.row === 0 && focusedCell?.col === col)) ? 0 : -1}
                aria-label={`String ${STRING_LABELS[s]}, ${stateDesc}`}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => { lastFocusSource.current = "mouse"; onToggleOpenMute(s); }}
                onFocus={() => setFocusedCell({ row: 0, col })}
                onKeyDown={(e) => handleKeyDown(e, 0, col)}
              >
                <NoteCircle
                  label={label}
                  bgColor={bgColor}
                  borderColor={borderColor}
                  dashed={dashed}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Nut */}
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
            role="row"
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

            {STRINGS_LR.map((s, col) => {
              const state = stringStates[s];
              const isPlacedHere = state.kind === "fret" && state.fret === fret;
              const isCorrect = isPlacedHere && validPositions.has(`${s}-${fret}`);
              const stringColor = state.kind === "muted" ? C.stringMuted : C.string;

              return (
                <div key={s} role="gridcell" className="relative flex items-center justify-center">
                  {/* String line */}
                  <div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ width: STRING_PX[s], backgroundColor: stringColor }}
                  />
                  <button
                    ref={(el) => { cellRefs.current[fret][col] = el; }}
                    tabIndex={!disabled && focusedCell?.row === fret && focusedCell?.col === col ? 0 : -1}
                    aria-label={`String ${STRING_LABELS[s]}, fret ${fret}`}
                    aria-pressed={isPlacedHere}
                    className="absolute inset-0 w-full h-full flex items-center justify-center hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
                    onClick={() => { lastFocusSource.current = "mouse"; onFretClick(s, fret); }}
                    onFocus={() => setFocusedCell({ row: fret, col })}
                    onKeyDown={(e) => handleKeyDown(e, fret, col)}
                  >
                    {isPlacedHere && (
                      <NoteCircle
                        label={isCorrect ? noteNameAtFret(s, fret) : ""}
                        bgColor={isCorrect ? colorForStringFret(chord.root, s, fret) : undefined}
                        borderColor={isCorrect ? undefined : C.dashStroke}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

export default Fretboard;
