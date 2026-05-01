"use client";

import type { ChordDefinition, PlacedNote, StringNumber } from "@/types/chord";
import { getChordNotes, getParentScaleNotes } from "@/lib/theory";
import { strings } from "@/lib/strings";
import NoteCircle from "@/components/NoteCircle";
import { INTERVAL_COLOR_BY_LABEL, COLOR_GRAY } from "@/lib/colors";

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
  // that any accepted voicing says should be at that fret
  const allFingerings = chord.fingerings.flat();
  const checkedPitchClasses = new Set<string>();
  for (const p of placedNotes) {
    const canonical = allFingerings.find(
      (f) => f.string === p.string && f.fret === p.fret && !f.muted
    );
    if (canonical) {
      checkedPitchClasses.add(pitchClassFromFret(p.string as StringNumber, p.fret));
    }
  }

  const isAdd9 = chord.quality.includes("add9") || chord.quality === "9";

  return (
    <div className="mt-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-transparent rounded-xl w-full">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {chord.root} {chord.quality.includes("m") && !chord.quality.includes("maj") ? strings.theory.naturalMinor : strings.theory.major} {strings.theory.scale}
      </p>
      <div className="flex gap-1 justify-between">
        {scaleNotes.map((note) => {
          const label = semitoneLabel(chord.root, note);
          const isInChord = chordNoteSet.has(note);
          const isChecked = checkedPitchClasses.has(note);
          const opacityClass = isInChord ? "" : "opacity-30";
          const show9 = isAdd9 && label === "2";

          return (
            <NoteCircle
              key={note}
              label={note}
              bgColor={isInChord ? (INTERVAL_COLOR_BY_LABEL[label] ?? COLOR_GRAY) : undefined}
              borderColor={isInChord ? undefined : undefined}
              dim={!isInChord}
              badge={show9 ? "9" : undefined}
              sublabel={label}
              checked={isChecked}
            />
          );
        })}
      </div>
    </div>
  );
}
