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

function checkFingering(
  states: StringStates,
  fingering: ChordDefinition["fingerings"][number]
): ValidationResult {
  let anyInteraction = false;
  let anyIncorrect = false;
  let anyIncomplete = false;

  for (const f of fingering) {
    const s = f.string as keyof StringStates;
    const student = states[s];
    const canonicalFret = f.fret;

    if (student.kind === "fret") anyInteraction = true;
    if (student.kind === "muted") anyInteraction = true;

    if (f.muted) {
      if (student.kind === "fret") { anyIncorrect = true; continue; }
      if (student.kind === "open") { anyIncomplete = true; continue; }
    } else if (canonicalFret === 0) {
      if (student.kind === "muted") { anyIncorrect = true; continue; }
      if (student.kind === "open") { anyIncomplete = true; continue; }
      if (student.kind === "fret" && student.fret !== 0) { anyIncorrect = true; continue; }
    } else {
      if (student.kind === "muted") { anyIncorrect = true; continue; }
      if (student.kind === "open") { anyIncomplete = true; continue; }
      if (student.kind === "fret" && student.fret !== canonicalFret) { anyIncorrect = true; continue; }
    }
  }

  if (!anyInteraction) return "incomplete";
  if (anyIncorrect) return "incorrect";
  if (anyIncomplete) return "incomplete";
  return "correct";
}

export function validateAnswer(
  states: StringStates,
  chord: ChordDefinition
): ValidationResult {
  // Accept if any voicing matches
  for (const fingering of chord.fingerings) {
    if (checkFingering(states, fingering) === "correct") return "correct";
  }
  // Return the best (least wrong) result across all voicings
  const results = chord.fingerings.map((f) => checkFingering(states, f));
  if (results.every((r) => r === "incomplete")) return "incomplete";
  if (results.some((r) => r === "incomplete") && results.every((r) => r !== "incorrect")) return "incomplete";
  return "incorrect";
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
