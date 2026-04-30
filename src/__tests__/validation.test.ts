import { validateAnswer } from "@/lib/validation";
import type { ChordDefinition, StringStates } from "@/types/chord";

// Helper to build a ChordDefinition from a tab string
// Tab format: E-A-D-G-B-e (string 6 to string 1), x=muted, digit=fret
function chordFromTab(id: string, name: string, root: string, quality: string, grade: 1|2|3|4, tab: string): ChordDefinition {
  const fingering = tab.split("-").map((val, i) => {
    const string = (6 - i) as 1|2|3|4|5|6;
    const muted = val === "x";
    const fret = muted ? null : parseInt(val);
    return { string, fret, finger: 0 as 0, muted, open: fret === 0 };
  });
  return { id, name, root, quality, grade, syllabus: "LCM" as const, fingering };
}

// Helper to build StringStates
function states(s6: string, s5: string, s4: string, s3: string, s2: string, s1: string): StringStates {
  const parse = (v: string, s: number) => {
    if (v === "x") return { kind: "muted" as const };
    if (v === "o") return { kind: "open" as const };
    return { kind: "fret" as const, fret: parseInt(v) };
  };
  return {
    6: parse(s6, 6), 5: parse(s5, 5), 4: parse(s4, 4),
    3: parse(s3, 3), 2: parse(s2, 2), 1: parse(s1, 1),
  };
}

const D6    = chordFromTab("d6",    "D6",    "D", "6",    4, "x-x-0-2-0-2");
const G6    = chordFromTab("g6",    "G6",    "G", "6",    4, "3-2-0-0-0-0");
const Amaj7 = chordFromTab("amaj7", "Amaj7", "A", "maj7", 2, "x-0-2-1-2-0");
const Cadd9 = chordFromTab("cadd9", "Cadd9", "C", "add9", 4, "x-3-2-0-3-0");
const Esus4 = chordFromTab("esus4", "Esus4", "E", "sus4", 3, "0-2-2-2-0-0");

// ─── No interaction ──────────────────────────────────────────────────────────

test("all open strings = incomplete", () => {
  expect(validateAnswer(states("o","o","o","o","o","o"), D6)).toBe("incomplete");
});

// ─── D6 (x-x-0-2-0-2) ───────────────────────────────────────────────────────

test("D6: correct full answer", () => {
  // E=muted, A=muted, D=open selected, G=fret2, B=open selected, e=fret2
  expect(validateAnswer(states("x","x","0","2","0","2"), D6)).toBe("correct");
});

test("D6: muting a string that should be open is incorrect", () => {
  expect(validateAnswer(states("x","x","x","2","0","2"), D6)).toBe("incorrect");
});

test("D6: leaving muted string as open is incomplete", () => {
  // E string should be muted but left as unselected open
  expect(validateAnswer(states("o","x","0","2","0","2"), D6)).toBe("incomplete");
});

test("D6: wrong fret on G string is incorrect", () => {
  expect(validateAnswer(states("x","x","0","3","0","2"), D6)).toBe("incorrect");
});

test("D6: only some strings done = incomplete", () => {
  // Fretted G and e but haven't muted E/A or selected open strings
  expect(validateAnswer(states("o","o","o","2","o","2"), D6)).toBe("incomplete");
});

// ─── G6 (3-2-0-0-0-0) ───────────────────────────────────────────────────────

test("G6: correct — all open strings selected, frets on E and A", () => {
  expect(validateAnswer(states("3","2","0","0","0","0"), G6)).toBe("correct");
});

test("G6: unselected open strings (kind=open) = incomplete", () => {
  // Student placed frets on E and A but hasn't clicked the open strings
  expect(validateAnswer(states("3","2","o","o","o","o"), G6)).toBe("incomplete");
});

test("G6: fretting a string that should be open = incorrect", () => {
  expect(validateAnswer(states("3","2","0","1","0","0"), G6)).toBe("incorrect");
});

// ─── Amaj7 (x-0-2-1-2-0) ────────────────────────────────────────────────────

test("Amaj7: correct full answer", () => {
  expect(validateAnswer(states("x","0","2","1","2","0"), Amaj7)).toBe("correct");
});

test("Amaj7: correct frets but E string not yet muted = incomplete", () => {
  expect(validateAnswer(states("o","0","2","1","2","0"), Amaj7)).toBe("incomplete");
});

// ─── Cadd9 (x-3-2-0-3-0) ────────────────────────────────────────────────────

test("Cadd9: correct full answer", () => {
  expect(validateAnswer(states("x","3","2","0","3","0"), Cadd9)).toBe("correct");
});

test("Cadd9: low E not muted = incomplete", () => {
  expect(validateAnswer(states("o","3","2","0","3","0"), Cadd9)).toBe("incomplete");
});

// ─── Esus4 (0-2-2-2-0-0) ────────────────────────────────────────────────────

test("Esus4: correct full answer", () => {
  expect(validateAnswer(states("0","2","2","2","0","0"), Esus4)).toBe("correct");
});

test("Esus4: wrong fret on A string", () => {
  expect(validateAnswer(states("0","3","2","2","0","0"), Esus4)).toBe("incorrect");
});

// ─── String state cycles ─────────────────────────────────────────────────────

test("clicking same fret twice resets to open (via PLACE_NOTE toggle)", () => {
  // Simulating: student places fret 2 on string 3, then clicks it again
  // QuizController handles this — here we just verify validation sees unselected
  const s = states("x","x","0","o","0","2");
  expect(validateAnswer(s, D6)).toBe("incomplete"); // G not yet placed
});
