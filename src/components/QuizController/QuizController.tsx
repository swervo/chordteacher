"use client";

import { useReducer, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  ChordDefinition, GradeNumber, StringNumber, StringState,
  StringStates, ValidationResult,
} from "@/types/chord";
import { getChordsForGrade, shuffleChords } from "@/data/index";
import { validateAnswer, activePlacedNotes } from "@/lib/validation";
import Fretboard from "@/components/Fretboard/Fretboard";
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
      if (current.kind === "fret") {
        next = { kind: "open" };       // clear fret → open
      } else if (current.kind === "muted") {
        next = { kind: "open" };       // unmute → open
      } else {
        next = { kind: "muted" };      // open → mute
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

let strumChordFn: ((fingering: ChordDefinition["fingering"]) => Promise<void>) | null = null;
let pluckNoteFn: ((string: StringNumber, fret: number) => Promise<void>) | null = null;

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

  useEffect(() => {
    if (state.phase === "success" && strumChordFn && chord) {
      strumChordFn(chord.fingering);
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
    if (chord && strumChordFn) strumChordFn(chord.fingering);
  }, [chord]);

  if (!chord) return null;

  const placedNotes = activePlacedNotes(state.stringStates);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-4">
      <AudioEngine
        onReady={(strum, pluck) => {
          strumChordFn = strum;
          pluckNoteFn = pluck;
        }}
      />

      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>Grade {state.grade}</span>
        <span>·</span>
        <span>{state.score.correct} correct</span>
        <span>·</span>
        <span>{state.chordQueue.length - state.currentIndex} remaining</span>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Play this chord</p>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">{chord.name}</h1>
        {!chord.verified && (
          <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">⚠ Verify fingering against your syllabus</p>
        )}
      </div>

      {state.phase === "success" && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-xl px-6 py-3">
          <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
          <span className="text-green-700 dark:text-green-300 font-medium">Correct!</span>
          <button
            onClick={() => dispatch({ type: "NEXT_CHORD" })}
            className="ml-4 px-4 py-1.5 bg-green-600 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Next →
          </button>
        </div>
      )}
      {state.validationResult === "incorrect" && state.phase !== "success" && (
        <div className="text-amber-600 dark:text-amber-400 text-sm">Wrong note — try adjusting</div>
      )}

      <Fretboard
        chord={chord}
        stringStates={state.stringStates}
        onFretClick={handleFretClick}
        onToggleOpenMute={handleToggleOpenMute}
      />

      <div className="flex gap-3">
        <button
          onClick={handleHear}
          className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          ♪ Hear chord
        </button>
        <button
          onClick={() => dispatch({ type: "CLEAR" })}
          className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => dispatch({ type: "NEXT_CHORD" })}
          className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
        >
          Skip
        </button>
      </div>

      <TheoryPanel chord={chord} placedNotes={placedNotes} />
    </div>
  );
}
