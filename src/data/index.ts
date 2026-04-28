import type { ChordDefinition, GradeNumber, StringFingering, StringNumber } from "@/types/chord";
import grade1 from "./chords-grade1.json";
import grade2 from "./chords-grade2.json";
import grade3 from "./chords-grade3.json";
import grade4 from "./chords-grade4.json";

// Tab string format: "E-A-D-G-B-e" (string 6 to string 1, low to high)
// Values: digit = fret number, x = muted
function tabToFingering(tab: string): StringFingering[] {
  return tab.split("-").map((val, i) => {
    const string = (6 - i) as StringNumber; // position 0=string 6 (E), position 5=string 1 (e)
    const muted = val === "x";
    const fret = muted ? null : parseInt(val);
    return { string, fret, finger: 0, muted, open: fret === 0 };
  });
}

type RawChord = Omit<ChordDefinition, "fingering"> & { tab: string };

function parseChords(raw: RawChord[]): ChordDefinition[] {
  return raw.map(({ tab, ...rest }) => ({
    ...rest,
    fingering: tabToFingering(tab),
  }));
}

export const ALL_CHORDS: ChordDefinition[] = [
  ...parseChords(grade1 as RawChord[]),
  ...parseChords(grade2 as RawChord[]),
  ...parseChords(grade3 as RawChord[]),
  ...parseChords(grade4 as RawChord[]),
];

export function getChordsForGrade(grade: GradeNumber): ChordDefinition[] {
  return ALL_CHORDS.filter((c) => c.grade === grade);
}

export function shuffleChords(chords: ChordDefinition[]): ChordDefinition[] {
  return [...chords].sort(() => Math.random() - 0.5);
}
