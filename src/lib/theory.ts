import { Chord, Scale, Interval, Note } from "tonal";

const INTERVAL_DISPLAY: Record<string, string> = {
  "1P": "R",
  "2M": "2",
  "3M": "3",
  "3m": "m3",
  "4P": "4",
  "5P": "5",
  "6M": "6",
  "7M": "maj7",
  "7m": "7",
  "9M": "9",
};

export function getChordNotes(root: string, quality: string): string[] {
  // Major chords use "M" quality in Tonal but we store "M" for major
  const symbol = quality === "M" ? "" : quality;
  return Chord.get(`${root}${symbol}`).notes;
}

export function getIntervalLabel(root: string, notePC: string): string {
  const semitones = Note.midi(`${notePC}4`)! - Note.midi(`${root}4`)!;
  const normalized = ((semitones % 12) + 12) % 12;
  // Map semitones to interval
  const semitoneToInterval: Record<number, string> = {
    0: "R", 2: "2", 4: "3", 3: "m3", 5: "4", 7: "5",
    9: "6", 11: "maj7", 10: "7", 14: "9",
  };
  return semitoneToInterval[normalized] ?? notePC;
}

export function getParentScaleNotes(root: string, scale: "major" | "minor"): string[] {
  return Scale.get(`${root} ${scale}`).notes;
}

export function getChordIntervals(root: string, quality: string): string[] {
  const symbol = quality === "M" ? "" : quality;
  return Chord.get(`${root}${symbol}`).intervals;
}
