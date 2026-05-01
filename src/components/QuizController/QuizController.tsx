"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type {
  ChordDefinition, GradeNumber, StringNumber, StringState,
  StringStates, ValidationResult,
} from "@/types/chord";
import { getChordsForGrade, shuffleChords } from "@/data/index";
import { strings } from "@/lib/strings";
import { validateAnswer, activePlacedNotes } from "@/lib/validation";
import Fretboard, { type FretboardHandle } from "@/components/Fretboard/Fretboard";
import TheoryPanel from "@/components/TheoryPanel/TheoryPanel";

const AudioEngine = dynamic(() => import("@/components/AudioEngine/AudioEngine"), { ssr: false });

const ALL_STRINGS: StringNumber[] = [1, 2, 3, 4, 5, 6];

function allOpen(): StringStates {
  return Object.fromEntries(ALL_STRINGS.map((s) => [s, { kind: "open" }])) as StringStates;
}

interface QuizState {
  grade: GradeNumber;
  chordQueue: ChordDefinition[];
  currentIndex: number;
  stringStates: StringStates;
  validationResult: ValidationResult | null;
  phase: "quiz" | "success";
  score: { correct: number; total: number };
}

type QuizAction =
  | { type: "PLACE_NOTE"; string: StringNumber; fret: number }
  | { type: "TOGGLE_OPEN_MUTE"; string: StringNumber }
  | { type: "NEXT_CHORD" }
  | { type: "CLEAR" }
  | { type: "RESET"; grade: GradeNumber };

function buildQueue(grade: GradeNumber): ChordDefinition[] {
  return shuffleChords(getChordsForGrade(grade));
}

function applyAndValidate(
  states: StringStates,
  chord: ChordDefinition,
  score: QuizState["score"]
): Pick<QuizState, "stringStates" | "validationResult" | "phase" | "score"> {
  const result = validateAnswer(states, chord);
  return {
    stringStates: states,
    validationResult: result,
    phase: result === "correct" ? "success" : "quiz",
    score: result === "correct"
      ? { correct: score.correct + 1, total: score.total + 1 }
      : score,
  };
}

function reducer(state: QuizState, action: QuizAction): QuizState {
  const chord = state.chordQueue[state.currentIndex];

  switch (action.type) {
    case "PLACE_NOTE": {
      const current = state.stringStates[action.string];
      // Clicking the same fret again resets the string to open
      const next: StringState = (current.kind === "fret" && current.fret === action.fret)
        ? { kind: "open" }
        : { kind: "fret", fret: action.fret };
      const updated: StringStates = { ...state.stringStates, [action.string]: next };
      return { ...state, ...applyAndValidate(updated, chord, state.score) };
    }

    case "TOGGLE_OPEN_MUTE": {
      const current = state.stringStates[action.string];
      let next: StringState;
      if (current.kind === "open") {
        next = { kind: "fret", fret: 0 };  // unselected → selected open
        // play the open string note
        setTimeout(() => pluckNoteFn?.(action.string, 0), 0);
      } else if (current.kind === "fret" && current.fret === 0) {
        next = { kind: "muted" };           // selected open → muted
        setTimeout(() => muteSoundFn?.(), 0);
      } else if (current.kind === "muted") {
        next = { kind: "open" };            // muted → unselected
      } else {
        next = { kind: "open" };            // fretted note → clear to unselected
      }
      const updated: StringStates = { ...state.stringStates, [action.string]: next };
      return { ...state, ...applyAndValidate(updated, chord, state.score) };
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

    case "CLEAR":
      return { ...state, stringStates: allOpen(), validationResult: null, phase: "quiz" };

    case "RESET":
      return {
        grade: action.grade,
        chordQueue: buildQueue(action.grade),
        currentIndex: 0,
        stringStates: allOpen(),
        validationResult: null,
        phase: "quiz",
        score: { correct: 0, total: 0 },
      };

    default:
      return state;
  }
}

let strumChordFn: ((fingering: ChordDefinition["fingerings"][number]) => Promise<void>) | null = null;
let pluckNoteFn: ((string: StringNumber, fret: number) => Promise<void>) | null = null;
let muteSoundFn: (() => void) | null = null;

export default function QuizController({ grade }: { grade: GradeNumber }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    grade,
    chordQueue: buildQueue(grade),
    currentIndex: 0,
    stringStates: allOpen(),
    validationResult: null,
    phase: "quiz" as const,
    score: { correct: 0, total: 0 },
  }));

  const chord = state.chordQueue[state.currentIndex];

  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const fretboardRef = useRef<FretboardHandle>(null);

  useEffect(() => {
    if (state.phase === "success") {
      if (strumChordFn && chord) strumChordFn(chord.fingerings[0]);
      nextButtonRef.current?.focus();
    }
  }, [state.phase, chord]);

  const handleFretClick = useCallback(
    (string: StringNumber, fret: number) => {
      if (state.phase === "success") return;
      dispatch({ type: "PLACE_NOTE", string, fret });
      pluckNoteFn?.(string, fret);
    },
    [state.phase]
  );

  const handleToggleOpenMute = useCallback(
    (string: StringNumber) => {
      if (state.phase === "success") return;
      dispatch({ type: "TOGGLE_OPEN_MUTE", string });
    },
    [state.phase]
  );

  const handleHear = useCallback(() => {
    if (chord && strumChordFn) strumChordFn(chord.fingerings[0]);
  }, [chord]);

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_CHORD" });
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, []);

  if (!chord) return null;

  const placedNotes = activePlacedNotes(state.stringStates);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-3">
      <AudioEngine
        onReady={(strum, pluck, mute) => {
          strumChordFn = strum;
          pluckNoteFn = pluck;
          muteSoundFn = mute;
        }}
      />

      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{strings.quiz.grade} {state.grade}</span>
        <span>·</span>
        <span>{state.score.correct} {strings.quiz.correctCount}</span>
        <span>·</span>
        <span>{state.chordQueue.length - state.currentIndex} {strings.quiz.remaining}</span>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">{strings.quiz.instruction}</p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{chord.name}</h1>
      </div>


      {/* Neck-width container — fretboard and theory panel share the same max-w-sm */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
        <div className="relative">
          <Fretboard
            ref={fretboardRef}
            chord={chord}
            stringStates={state.stringStates}
            onFretClick={handleFretClick}
            onToggleOpenMute={handleToggleOpenMute}
            disabled={state.phase === "success"}
          />
          {state.phase === "success" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/50 dark:bg-gray-900/60 backdrop-blur-sm">
              <span className="text-5xl">✓</span>
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">{strings.quiz.correct}</span>
              <button
                ref={nextButtonRef}
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                {strings.quiz.next}
              </button>
            </div>
          )}
        </div>

        <TheoryPanel chord={chord} placedNotes={placedNotes} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleHear}
          className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          {strings.quiz.hearChord}
        </button>
        <button
          onClick={() => dispatch({ type: "CLEAR" })}
          className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
        >
          {strings.quiz.clear}
        </button>
        <button
          onClick={handleNext}
          className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
        >
          {strings.quiz.skip}
        </button>
      </div>
    </div>
  );
}
