export type GradeNumber = 1 | 2 | 3 | 4;
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface StringFingering {
  string: StringNumber; // 1 = high E, 6 = low E
  fret: number | null;  // null = muted
  finger: 0 | 1 | 2 | 3 | 4;
  muted: boolean;
  open: boolean;
}

export interface ChordDefinition {
  id: string;
  name: string;
  root: string;
  quality: string;
  grade: GradeNumber;
  syllabus: "LCM";
  verified?: boolean;
  fingering: StringFingering[]; // generated from tab at load time
}

export type StringState =
  | { kind: "open" }
  | { kind: "muted" }
  | { kind: "fret"; fret: number };

export type StringStates = Record<StringNumber, StringState>;

export interface PlacedNote {
  string: StringNumber;
  fret: number;
}

export type ValidationResult = "correct" | "incorrect" | "incomplete";
