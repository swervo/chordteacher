"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import type { ChordDefinition, GradeNumber, StringNumber, StringState, StringStates, ValidationResult } from "@/types/chord";
import { getChordsForGrade, shuffleChords } from "@/data/index";
import { validateAnswer } from "@/lib/validation";
import type { Mode } from "@/lib/useMode";
import type { FretboardHandle } from "@/components/Fretboard/Fretboard";

// ─── State & Actions ─────────────────────────────────────────────────────────

export interface QuizState {
  grade: GradeNumber;
  chordQueue: ChordDefinition[];
  currentIndex: number;
  stringStates: StringStates;
  validationResult: ValidationResult | null;
  phase: "quiz" | "success" | "submitted" | "complete";
  score: number;
  skippedChords: ChordDefinition[];
}

type QuizAction =
  | { type: "PLACE_NOTE"; string: StringNumber; fret: number }
  | { type: "TOGGLE_OPEN_MUTE"; string: StringNumber }
  | { type: "NEXT_CHORD" }
  | { type: "SKIP" }
  | { type: "ADVANCE" }
  | { type: "SUBMIT" }
  | { type: "CLEAR" }
  | { type: "RESET"; grade: GradeNumber };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL_STRINGS: StringNumber[] = [1, 2, 3, 4, 5, 6];

function allOpen(): StringStates {
  return Object.fromEntries(ALL_STRINGS.map((s) => [s, { kind: "open" }])) as StringStates;
}

function allSelectedOpen(): StringStates {
  return Object.fromEntries(ALL_STRINGS.map((s) => [s, { kind: "fret", fret: 0 }])) as StringStates;
}

function buildQueue(grade: GradeNumber): ChordDefinition[] {
  return shuffleChords(getChordsForGrade(grade));
}

function initialStringStates(isExam: boolean): StringStates {
  return isExam ? allSelectedOpen() : allOpen();
}

function applyAndValidate(
  states: StringStates,
  chord: ChordDefinition,
  score: number
): Pick<QuizState, "stringStates" | "validationResult" | "phase" | "score"> {
  const result = validateAnswer(states, chord);
  return {
    stringStates: states,
    validationResult: result,
    phase: result === "correct" ? "success" : "quiz",
    score: result === "correct" ? score + 1 : score,
  };
}

function advanceQueue(state: QuizState, isExam: boolean): Partial<QuizState> {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.chordQueue.length) return { phase: "complete" };
  return {
    currentIndex: nextIndex,
    stringStates: initialStringStates(isExam),
    validationResult: null,
    phase: "quiz",
  };
}

// ─── Audio refs (module-level to avoid SSR issues) ───────────────────────────

let strumChordFn: ((fingering: ChordDefinition["fingerings"][number]) => Promise<void>) | null = null;
let pluckNoteFn: ((string: StringNumber, fret: number) => Promise<void>) | null = null;
let muteSoundFn: (() => void) | null = null;

export function setAudioFns(
  strum: typeof strumChordFn,
  pluck: typeof pluckNoteFn,
  mute: typeof muteSoundFn
) {
  strumChordFn = strum;
  pluckNoteFn = pluck;
  muteSoundFn = mute;
}

// ─── Reducer factory ─────────────────────────────────────────────────────────

function makeReducer(mode: Mode) {
  return function reducer(state: QuizState, action: QuizAction): QuizState {
    const chord = state.chordQueue[state.currentIndex];
    const isExam = mode === "exam";

    switch (action.type) {
      case "PLACE_NOTE": {
        const current = state.stringStates[action.string];
        const next: StringState = (current.kind === "fret" && current.fret === action.fret)
          ? (isExam ? { kind: "fret", fret: 0 } : { kind: "open" })
          : { kind: "fret", fret: action.fret };
        const updated: StringStates = { ...state.stringStates, [action.string]: next };
        if (isExam) return { ...state, stringStates: updated };
        return { ...state, ...applyAndValidate(updated, chord, state.score) };
      }

      case "TOGGLE_OPEN_MUTE": {
        const current = state.stringStates[action.string];
        let next: StringState;
        if (current.kind === "open") {
          next = { kind: "fret", fret: 0 };
          setTimeout(() => pluckNoteFn?.(action.string, 0), 0);
        } else if (current.kind === "fret" && current.fret === 0) {
          next = { kind: "muted" };
          setTimeout(() => muteSoundFn?.(), 0);
        } else if (current.kind === "muted") {
          next = { kind: "open" };
        } else {
          next = { kind: "open" };
        }
        const updated: StringStates = { ...state.stringStates, [action.string]: next };
        if (isExam) return { ...state, stringStates: updated };
        return { ...state, ...applyAndValidate(updated, chord, state.score) };
      }

      case "SUBMIT": {
        const result = validateAnswer(state.stringStates, chord);
        return {
          ...state,
          validationResult: result,
          phase: "submitted",
          score: result === "correct" ? state.score + 1 : state.score,
        };
      }

      case "NEXT_CHORD": {
        const nextIndex = (state.currentIndex + 1) % state.chordQueue.length;
        const reshuffled = nextIndex === 0 ? shuffleChords(state.chordQueue) : state.chordQueue;
        return {
          ...state,
          chordQueue: reshuffled,
          currentIndex: nextIndex,
          stringStates: allOpen(),
          validationResult: null,
          phase: "quiz",
        };
      }

      case "SKIP":
        return { ...state, skippedChords: [...state.skippedChords, chord], ...advanceQueue(state, isExam) };

      case "ADVANCE":
        return { ...state, ...advanceQueue(state, isExam) };

      case "CLEAR":
        return { ...state, stringStates: initialStringStates(isExam), validationResult: null, phase: "quiz" };

      case "RESET":
        return {
          grade: action.grade,
          chordQueue: buildQueue(action.grade),
          currentIndex: 0,
          stringStates: initialStringStates(isExam),
          validationResult: null,
          phase: "quiz",
          score: 0,
          skippedChords: [],
        };

      default:
        return state;
    }
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuizState(grade: GradeNumber, mode: Mode, fretboardRef: React.RefObject<FretboardHandle | null>) {
  const isExam = mode === "exam";
  const reducer = makeReducer(mode);

  const [state, dispatch] = useReducer(reducer, null, () => ({
    grade,
    chordQueue: buildQueue(grade),
    currentIndex: 0,
    stringStates: initialStringStates(isExam),
    validationResult: null,
    phase: "quiz" as const,
    score: 0,
    skippedChords: [] as ChordDefinition[],
  }));

  const chord = state.chordQueue[state.currentIndex];
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.phase === "success") {
      if (strumChordFn && chord) strumChordFn(chord.fingerings[0]);
      nextButtonRef.current?.focus();
    }
    if (state.phase === "submitted") {
      if (state.validationResult === "correct" && strumChordFn && chord) strumChordFn(chord.fingerings[0]);
      nextButtonRef.current?.focus();
    }
  }, [state.phase, chord]);

  const handleFretClick = useCallback((string: StringNumber, fret: number) => {
    if (state.phase === "success" || state.phase === "submitted") return;
    dispatch({ type: "PLACE_NOTE", string, fret });
    pluckNoteFn?.(string, fret);
  }, [state.phase]);

  const handleToggleOpenMute = useCallback((string: StringNumber) => {
    if (state.phase === "success" || state.phase === "submitted") return;
    dispatch({ type: "TOGGLE_OPEN_MUTE", string });
  }, [state.phase]);

  const handleHear = useCallback(() => {
    if (chord && strumChordFn) strumChordFn(chord.fingerings[0]);
  }, [chord]);

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_CHORD" });
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, [fretboardRef]);

  const handleExamNext = useCallback(() => {
    dispatch({ type: "ADVANCE" });
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, [fretboardRef]);

  const handleSubmit = useCallback(() => dispatch({ type: "SUBMIT" }), []);
  const handleClear = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const handleSkip = useCallback(() => dispatch({ type: "SKIP" }), []);
  const handleReset = useCallback(() => dispatch({ type: "RESET", grade }), [grade]);

  return {
    state,
    chord,
    nextButtonRef,
    handleFretClick,
    handleToggleOpenMute,
    handleHear,
    handleNext,
    handleExamNext,
    handleSubmit,
    handleClear,
    handleSkip,
    handleReset,
  };
}
