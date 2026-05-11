import { Note } from "tonal";
import type { StringNumber } from "@/types/chord";
import { INTERVAL_COLORS, COLOR_GRAY } from "@/lib/colors";

const OPEN_STRINGS: Record<StringNumber, string> = {
  6: "E2",
  5: "A2",
  4: "D3",
  3: "G3",
  2: "B3",
  1: "E4",
};

export function noteAtFret(string: StringNumber, fret: number): string {
  const openMidi = Note.midi(OPEN_STRINGS[string])!;
  return Note.fromMidiSharps(openMidi + fret);
}

export function pitchClassAtFret(string: StringNumber, fret: number): string {
  return Note.pitchClass(noteAtFret(string, fret));
}

export function noteNameAtFret(string: StringNumber, fret: number): string {
  return Note.pitchClass(noteAtFret(string, fret));
}

export function colorForStringFret(root: string, string: StringNumber, fret: number): string {
  const rootMidi = Note.midi(`${root}4`);
  if (rootMidi === null) return COLOR_GRAY;
  const openMidi = Note.midi(OPEN_STRINGS[string])!;
  const semitones = ((openMidi + fret - rootMidi) % 12 + 12) % 12;
  return INTERVAL_COLORS[semitones] ?? COLOR_GRAY;
}

export const OPEN_STRING_NOTES = OPEN_STRINGS;
export const NUM_FRETS = 7;
