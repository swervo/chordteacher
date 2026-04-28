import { Note } from "tonal";
import type { StringNumber } from "@/types/chord";

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
  return Note.fromMidi(openMidi + fret);
}

export function pitchClassAtFret(string: StringNumber, fret: number): string {
  return Note.pitchClass(noteAtFret(string, fret));
}

export const OPEN_STRING_NOTES = OPEN_STRINGS;
export const NUM_FRETS = 7;
