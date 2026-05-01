"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type {
  ChordDefinition, GradeNumber, StringNumber, StringState,
  StringStates, ValidationResult,
} from "@/types/chord";
import { getChordsForGrade, shuffleChords } from "@/data/index";
import { strings } from "@/lib/strings";
import type { Mode } from "@/lib/useMode";
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
  phase: "quiz" | "success" | "submitted" | "complete";
  score: number;
  skippedChords: ChordDefinition[];
}

type QuizAction =
  | { type: "PLACE_NOTE"; string: StringNumber; fret: number }
  | { type: "TOGGLE_OPEN_MUTE"; string: StringNumber }
  | { type: "NEXT_CHORD" }
  | { type: "SKIP" }
  | { type: "SUBMIT" }
  | { type: "CLEAR" }
  | { type: "RESET"; grade: GradeNumber };

function buildQueue(grade: GradeNumber): ChordDefinition[] {
  return shuffleChords(getChordsForGrade(grade));
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

function advanceQueue(state: QuizState): Partial<QuizState> {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.chordQueue.length) {
    return { phase: "complete" };
  }
  return {
    currentIndex: nextIndex,
    stringStates: allOpen(),
    validationResult: null,
    phase: "quiz",
  };
}

function reducer(state: QuizState, action: QuizAction): QuizState {
  const chord = state.chordQueue[state.currentIndex];

  switch (action.type) {
    case "PLACE_NOTE": {
      const current = state.stringStates[action.string];
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
      return { ...state, ...applyAndValidate(updated, chord, state.score) };
    }

    case "SUBMIT": {
      const result = validateAnswer(state.stringStates, chord);
      const correct = result === "correct";
      return {
        ...state,
        validationResult: result,
        phase: "submitted",
        score: correct ? state.score + 1 : state.score,
      };
    }

    case "NEXT_CHORD": {
      // Practice mode — loops and reshuffles
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

    case "SKIP": {
      return {
        ...state,
        skippedChords: [...state.skippedChords, chord],
        ...advanceQueue(state),
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
        score: 0,
        skippedChords: [],
      };

    default:
      return state;
  }
}

let strumChordFn: ((fingering: ChordDefinition["fingerings"][number]) => Promise<void>) | null = null;
let pluckNoteFn: ((string: StringNumber, fret: number) => Promise<void>) | null = null;
let muteSoundFn: (() => void) | null = null;

export default function QuizController({ grade, mode = "practice" }: { grade: GradeNumber; mode?: Mode }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    grade,
    chordQueue: buildQueue(grade),
    currentIndex: 0,
    stringStates: allOpen(),
    validationResult: null,
    phase: "quiz" as const,
    score: 0,
    skippedChords: [] as ChordDefinition[],
  }));

  const chord = state.chordQueue[state.currentIndex];
  const isExam = mode === "exam";
  const maxScore = state.chordQueue.length;

  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const fretboardRef = useRef<FretboardHandle>(null);

  const handleNextInExam = useCallback(() => {
    const next = advanceQueue(state);
    if (next.phase === "complete") {
      dispatch({ type: "SKIP" }); // will set complete via advanceQueue
    } else {
      // After submit, advance to next chord
      dispatch({ type: "SKIP" }); // reuse SKIP's advance logic but chord wasn't actually skipped
    }
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, [state]);

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

  const handleFretClick = useCallback(
    (string: StringNumber, fret: number) => {
      if (state.phase === "success" || state.phase === "submitted") return;
      if (!isExam) dispatch({ type: "PLACE_NOTE", string, fret });
      else {
        // In exam mode, just update string state without auto-validating
        dispatch({ type: "PLACE_NOTE", string, fret });
      }
      pluckNoteFn?.(string, fret);
    },
    [state.phase, isExam]
  );

  const handleToggleOpenMute = useCallback(
    (string: StringNumber) => {
      if (state.phase === "success" || state.phase === "submitted") return;
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

  const handleExamNext = useCallback(() => {
    dispatch({ type: "SKIP" });
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, []);

  const handleSubmit = useCallback(() => {
    dispatch({ type: "SUBMIT" });
  }, []);

  // Complete screen (exam mode only)
  if (state.phase === "complete") {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{strings.quiz.examComplete}</h1>
        <div className="text-6xl font-bold text-gray-900 dark:text-white">
          {state.score}<span className="text-2xl text-gray-400 dark:text-gray-500">/{maxScore}</span>
        </div>
        {state.skippedChords.length > 0 && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-transparent text-left">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{strings.quiz.skippedChords}</p>
            <div className="flex flex-wrap gap-2">
              {state.skippedChords.map((c) => (
                <span key={c.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: "RESET", grade })}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            {strings.quiz.playAgain}
          </button>
          <a
            href="/"
            className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            {strings.quiz.backToGrades}
          </a>
        </div>
      </div>
    );
  }

  if (!chord) return null;

  const placedNotes = activePlacedNotes(state.stringStates);
  const isSubmitted = state.phase === "submitted";
  const submitCorrect = isSubmitted && state.validationResult === "correct";

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
        {isExam && (<><span>·</span><span>{state.score} {strings.quiz.correctCount}</span></>)}
        <span>·</span>
        <span>{state.chordQueue.length - state.currentIndex} {strings.quiz.remaining}</span>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">{strings.quiz.instruction}</p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{chord.name}</h1>
      </div>

      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
        <div className="relative">
          <Fretboard
            ref={fretboardRef}
            chord={chord}
            stringStates={state.stringStates}
            onFretClick={handleFretClick}
            onToggleOpenMute={handleToggleOpenMute}
            disabled={state.phase === "success" || isSubmitted}
            hintsEnabled={!isExam}
          />
          {/* Practice mode success overlay */}
          {state.phase === "success" && !isExam && (
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
          {/* Exam mode submitted overlay */}
          {isSubmitted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/50 dark:bg-gray-900/60 backdrop-blur-sm">
              <span className="text-5xl">{submitCorrect ? "✓" : "✗"}</span>
              <span className={`text-2xl font-bold ${submitCorrect ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}>
                {submitCorrect ? strings.quiz.correct : strings.quiz.incorrect}
              </span>
              <button
                ref={nextButtonRef}
                onClick={handleExamNext}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                {strings.quiz.next}
              </button>
            </div>
          )}
        </div>

        <TheoryPanel chord={chord} placedNotes={placedNotes} hintsEnabled={!isExam} />
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
        {isExam ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {strings.quiz.submit}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
          >
            {strings.quiz.skip}
          </button>
        )}
        {isExam && (
          <button
            onClick={handleExamNext}
            disabled={isSubmitted}
            className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
          >
            {strings.quiz.skip}
          </button>
        )}
      </div>
    </div>
  );
}
