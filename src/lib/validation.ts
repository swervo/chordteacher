import type { ChordDefinition, PlacedNote, StringStates, ValidationResult } from "@/types/chord";
import { pitchClassAtFret } from "./fretboard";
import { getChordNotes } from "./theory";

// Convert StringStates map → sounding PlacedNote[] (open fret=0, fret notes)
export function activePlacedNotes(states: StringStates): PlacedNote[] {
  return (Object.entries(states) as [string, StringStates[keyof StringStates]][])
    .filter(([, s]) => s.kind !== "muted")
    .map(([str, s]) => ({
      string: Number(str) as PlacedNote["string"],
      fret: s.kind === "fret" ? s.fret : 0,
    }));
}

export function validateAnswer(
  states: StringStates,
  chord: ChordDefinition
): ValidationResult {
  let anyInteraction = false;
  let anyIncorrect = false;
  let anyIncomplete = false;

  for (const f of chord.fingering) {
    const s = f.string as keyof StringStates;
    const student = states[s];
    const canonicalFret = f.fret; // null = muted, 0 = open, N = fretted

    if (student.kind === "fret") anyInteraction = true;
    if (student.kind === "muted" && !f.muted) anyInteraction = true;

    if (f.muted) {
      // This string must be muted
      if (student.kind === "fret") { anyIncorrect = true; continue; }
      if (student.kind === "open") { anyIncomplete = true; continue; }
      // kind === "muted" → correct for this string
    } else if (canonicalFret === 0) {
      // This string must be open
      if (student.kind === "muted") { anyIncorrect = true; continue; }
      if (student.kind === "fret") { anyIncorrect = true; continue; }
      // kind === "open" → correct for this string
    } else {
      // This string must be fretted at canonicalFret
      if (student.kind === "muted") { anyIncorrect = true; continue; }
      if (student.kind === "open") { anyIncomplete = true; continue; }
      if (student.kind === "fret" && student.fret !== canonicalFret) { anyIncorrect = true; continue; }
      // correct fret → correct for this string
    }
  }

  if (!anyInteraction) return "incomplete";
  if (anyIncorrect) return "incorrect";
  if (anyIncomplete) return "incomplete";
  return "correct";
}

export function getPlacedIntervalLabel(
  placed: PlacedNote,
  chord: ChordDefinition
): string {
  const pc = pitchClassAtFret(placed.string, placed.fret);
  const chordNotes = getChordNotes(chord.root, chord.quality);
  if (!chordNotes.includes(pc)) return "?";

  // Semitone distance from root
  const { Note } = require("tonal");
  const rootMidi = Note.midi(`${chord.root}4`)!;
  const noteMidi = Note.midi(`${pc}4`)!;
  const semitones = ((noteMidi - rootMidi) % 12 + 12) % 12;

  const map: Record<number, string> = {
    0: "R", 2: "2", 3: "m3", 4: "3", 5: "4",
    7: "5", 9: "6", 10: "7", 11: "maj7", 14: "9",
  };
  return map[semitones] ?? pc;
}
