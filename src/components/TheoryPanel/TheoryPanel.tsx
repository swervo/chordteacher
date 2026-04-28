"use client";

import type { ChordDefinition, PlacedNote, StringNumber } from "@/types/chord";
import { pitchClassAtFret } from "@/lib/fretboard";
import { getChordNotes, getParentScaleNotes } from "@/lib/theory";

const INTERVAL_COLORS: Record<string, string> = {
  R: "bg-red-500 text-white",
  "3": "bg-blue-500 text-white",
  "m3": "bg-violet-500 text-white",
  "5": "bg-green-500 text-white",
  "maj7": "bg-purple-500 text-white",
  "7": "bg-orange-500 text-white",
  "2": "bg-amber-500 text-white",
  "4": "bg-amber-500 text-white",
  "6": "bg-amber-500 text-white",
  "9": "bg-amber-500 text-white",
};

function getSemitoneLabel(root: string, pc: string): string {
  const { Note } = require("tonal");
  const rootMidi = Note.midi(`${root}4`)!;
  const noteMidi = Note.midi(`${pc}4`)!;
  const semitones = ((noteMidi - rootMidi) % 12 + 12) % 12;
  const map: Record<number, string> = {
    0: "R", 1: "b2", 2: "2", 3: "m3", 4: "3", 5: "4",
    6: "b5", 7: "5", 8: "b6", 9: "6", 10: "7", 11: "maj7",
  };
  return map[semitones] ?? pc;
}

interface TheoryPanelProps {
  chord: ChordDefinition;
  placedNotes: PlacedNote[];
}

export default function TheoryPanel({ chord, placedNotes }: TheoryPanelProps) {
  const scaleNotes = getParentScaleNotes(chord.root, chord.quality);
  const chordNotes = new Set(getChordNotes(chord.root, chord.quality));
  const placedPCs = new Set(
    placedNotes.map((p) => pitchClassAtFret(p.string as StringNumber, p.fret))
  );

  const scaleName = chord.quality.includes("m") ? "natural minor" : "major";

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-xl">
      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
        {chord.root} {scaleName} scale
      </p>
      <div className="flex gap-2 flex-wrap">
        {scaleNotes.map((note) => {
          const isPlaced = placedPCs.has(note);
          const isInChord = chordNotes.has(note);
          const intervalLabel = getSemitoneLabel(chord.root, note);
          const colorClass = isPlaced
            ? INTERVAL_COLORS[intervalLabel] ?? "bg-gray-500 text-white"
            : isInChord
            ? "bg-gray-600 text-gray-300 ring-2 ring-gray-400"
            : "bg-gray-700 text-gray-500";

          return (
            <div key={note} className="flex flex-col items-center gap-1">
              <span
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${colorClass}`}
              >
                {note}
              </span>
              <span className="text-xs text-gray-500">{intervalLabel}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Bright = placed · Ringed = in chord · Dim = scale only
      </p>
    </div>
  );
}
