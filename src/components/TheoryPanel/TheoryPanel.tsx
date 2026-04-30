"use client";

import type { ChordDefinition, PlacedNote, StringNumber } from "@/types/chord";
import { getChordNotes, getParentScaleNotes } from "@/lib/theory";

const NOTE_MIDI: Record<string, number> = {
  C: 60, "C#": 61, Db: 61, D: 62, "D#": 63, Eb: 63,
  E: 64, F: 65, "F#": 66, Gb: 66, G: 67, "G#": 68,
  Ab: 68, A: 69, "A#": 70, Bb: 70, B: 71,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const OPEN_MIDI: Record<StringNumber, number> = {
  6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64,
};

const SEMITONE_TO_LABEL: Record<number, string> = {
  0: "R", 2: "2", 3: "m3", 4: "3", 5: "4", 7: "5", 9: "6", 10: "7", 11: "maj7",
};

const INTERVAL_COLORS: Record<string, string> = {
  R:      "bg-red-500",
  "3":    "bg-blue-500",
  "m3":   "bg-violet-500",
  "5":    "bg-green-500",
  "maj7": "bg-purple-500",
  "7":    "bg-orange-500",
  "2":    "bg-amber-500",
  "4":    "bg-amber-500",
  "6":    "bg-amber-500",
};

function semitoneLabel(root: string, note: string): string {
  const diff = (NOTE_MIDI[note] ?? 0) - (NOTE_MIDI[root] ?? 0);
  const semitones = ((diff % 12) + 12) % 12;
  return SEMITONE_TO_LABEL[semitones] ?? "?";
}

function pitchClassFromFret(string: StringNumber, fret: number): string {
  return NOTE_NAMES[(OPEN_MIDI[string] + fret) % 12];
}

interface TheoryPanelProps {
  chord: ChordDefinition;
  placedNotes: PlacedNote[];
}

export default function TheoryPanel({ chord, placedNotes }: TheoryPanelProps) {
  const scaleNotes = getParentScaleNotes(chord.root, chord.quality);
  const chordNoteSet = new Set(getChordNotes(chord.root, chord.quality));

  // A note is "checked" if the student has placed the correct fret on any string
  // that the canonical fingering says should be at that fret
  const checkedPitchClasses = new Set<string>();
  for (const p of placedNotes) {
    const canonical = chord.fingering.find(
      (f) => f.string === p.string && f.fret === p.fret && !f.muted
    );
    if (canonical) {
      checkedPitchClasses.add(pitchClassFromFret(p.string as StringNumber, p.fret));
    }
  }

  const isAdd9 = chord.quality.includes("add9") || chord.quality === "9";

  return (
    <div className="mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-transparent rounded-xl w-full">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
        {chord.root} {chord.quality.includes("m") && !chord.quality.includes("maj") ? "natural minor" : "major"} scale
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {scaleNotes.map((note) => {
          const label = semitoneLabel(chord.root, note);
          const isInChord = chordNoteSet.has(note);
          const isChecked = checkedPitchClasses.has(note);
          const colorClass = isInChord ? (INTERVAL_COLORS[label] ?? "bg-gray-500") : "bg-gray-200 dark:bg-gray-700";
          const opacityClass = isInChord ? "" : "opacity-30";
          const show9 = isAdd9 && label === "2";

          return (
            <div key={note} className={`flex flex-col items-center gap-1 transition-opacity ${opacityClass}`}>
              <div className="relative">
                <span className={`w-11 h-11 flex items-center justify-center rounded-full text-sm font-bold text-white ${colorClass}`}>
                  {note}
                </span>
                {show9 && (
                  <span className="absolute -top-1 -right-1 bg-gray-900 text-amber-400 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-amber-400">
                    9
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              <span className={`text-xs font-bold transition-all ${isChecked ? "text-green-500 dark:text-green-400" : "text-transparent"}`}>✓</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
