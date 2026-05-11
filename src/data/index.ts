import type { ChordDefinition, GradeNumber, ScaleDefinition, ScaleNote, StringFingering, StringNumber } from "@/types/chord";
import grade1 from "./chords-grade1.json";
import grade2 from "./chords-grade2.json";
import grade3 from "./chords-grade3.json";
import grade4 from "./chords-grade4.json";
import scaleShapes from "./scale-shapes.json";
import scales1 from "./scales-grade1.json";
import scales2 from "./scales-grade2.json";
import scales3 from "./scales-grade3.json";
import scales4 from "./scales-grade4.json";

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

type RawChord = Omit<ChordDefinition, "fingerings"> & { tabs: string[] };

function parseChords(raw: RawChord[]): ChordDefinition[] {
  return raw.map(({ tabs, ...rest }) => ({
    ...rest,
    fingerings: tabs.map(tabToFingering),
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

type RawShape = { id: string; notes: ScaleNote[] };
type RawScale = Omit<ScaleDefinition, "notes"> & { notes?: ScaleNote[]; derivedFrom?: string };

const shapeMap = new Map<string, ScaleNote[]>(
  (scaleShapes as RawShape[]).map((s) => [s.id, s.notes])
);

function parseScales(raw: RawScale[]): ScaleDefinition[] {
  return raw.map(({ derivedFrom, notes, ...rest }) => {
    const resolvedNotes = derivedFrom
      ? shapeMap.get(derivedFrom) ?? (() => { throw new Error(`scale-shapes.json: unknown shape id "${derivedFrom}"`); })()
      : notes!;
    return { ...rest, notes: resolvedNotes };
  });
}

const ALL_SCALES: ScaleDefinition[] = [
  ...parseScales(scales1 as RawScale[]),
  ...parseScales(scales2 as RawScale[]),
  ...parseScales(scales3 as RawScale[]),
  ...parseScales(scales4 as RawScale[]),
];

export function getScalesForGrade(grade: GradeNumber): ScaleDefinition[] {
  return ALL_SCALES.filter((s) => s.grade === grade);
}
