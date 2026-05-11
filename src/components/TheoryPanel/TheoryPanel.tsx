"use client";

import { Note } from "tonal";
import type { ChordDefinition, PlacedNote, StringNumber } from "@/types/chord";
import { getChordNotes, getParentScaleNotes } from "@/lib/theory";
import { strings } from "@/lib/strings";
import NoteCircle from "@/components/NoteCircle";
import { INTERVAL_COLOR_BY_LABEL, COLOR_GRAY } from "@/lib/colors";
import { noteNameAtFret } from "@/lib/fretboard";

const SEMITONE_TO_LABEL: Record<number, string> = {
  0: "R", 2: "2", 3: "m3", 4: "3", 5: "4", 7: "5", 9: "6", 10: "7", 11: "maj7",
};

function semitoneLabel(root: string, note: string): string {
  const rootMidi = Note.midi(`${root}4`) ?? 0;
  const noteMidi = Note.midi(`${note}4`) ?? 0;
  const semitones = ((noteMidi - rootMidi) % 12 + 12) % 12;
  return SEMITONE_TO_LABEL[semitones] ?? "?";
}

interface TheoryPanelProps {
  chord: ChordDefinition;
  placedNotes: PlacedNote[];
  hintsEnabled?: boolean;
}

export default function TheoryPanel({ chord, placedNotes, hintsEnabled = true }: TheoryPanelProps) {
  const scaleNotes = getParentScaleNotes(chord.root, chord.scale);
  const chordNotes = getChordNotes(chord.root, chord.quality);
  const chordNoteSet = new Set(chordNotes);

  const allFingerings = chord.fingerings.flat();
  const checkedPitchClasses = new Set<string>();
  for (const p of placedNotes) {
    const canonical = allFingerings.find(
      (f) => f.string === p.string && f.fret === p.fret && !f.muted
    );
    if (canonical) {
      checkedPitchClasses.add(noteNameAtFret(p.string as StringNumber, p.fret));
    }
  }

  const isAdd9 = chord.quality.includes("add9") || chord.quality === "9";
  const isDominant7 = chord.quality === "7";

  // For dominant 7ths, find the ♭7 note (in chord but not in major scale)
  const flatSeven = isDominant7
    ? chordNotes.find((n) => !scaleNotes.includes(n)) ?? null
    : null;

  const scaleLabel = chord.scale === "minor" ? strings.theory.naturalMinor : strings.theory.major;

  return (
    <div className="mt-0 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-transparent rounded-xl w-full">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {chord.root} {scaleLabel} {strings.theory.scale}
      </p>
      <div className="flex gap-1 justify-between items-start">
        {scaleNotes.map((note) => {
          const label = semitoneLabel(chord.root, note);
          // For dominant 7ths, swap the maj7 scale degree for the ♭7, nudged down
          const isSwappedForFlat7 = isDominant7 && label === "maj7" && flatSeven !== null;
          const displayNote = isSwappedForFlat7 ? flatSeven! : note;
          const displayLabel = isSwappedForFlat7 ? "♭7" : label;
          const isInChord = chordNoteSet.has(displayNote);
          const isChecked = checkedPitchClasses.has(displayNote);
          const show9 = isAdd9 && label === "2";

          return (
            <div key={note} className={isSwappedForFlat7 ? "mt-3" : ""}>
              <NoteCircle
                label={displayNote}
                bgColor={hintsEnabled
                  ? (isInChord ? (INTERVAL_COLOR_BY_LABEL[displayLabel] ?? COLOR_GRAY) : undefined)
                  : COLOR_GRAY}
                dim={hintsEnabled ? !isInChord : false}
                badge={hintsEnabled && show9 ? "9" : undefined}
                sublabel={hintsEnabled ? displayLabel : undefined}
                checked={hintsEnabled ? isChecked : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
