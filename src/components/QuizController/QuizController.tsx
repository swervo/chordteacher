"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import type { GradeNumber } from "@/types/chord";
import { strings } from "@/lib/strings";
import type { Mode } from "@/lib/useMode";
import { activePlacedNotes } from "@/lib/validation";
import Fretboard, { type FretboardHandle } from "@/components/Fretboard/Fretboard";
import TheoryPanel from "@/components/TheoryPanel/TheoryPanel";
import { useQuizState, setAudioFns } from "./useQuizState";

const AudioEngine = dynamic(() => import("@/components/AudioEngine/AudioEngine"), { ssr: false });

export default function QuizController({ grade, mode = "practice" }: { grade: GradeNumber; mode?: Mode }) {
  const isExam = mode === "exam";
  const fretboardRef = useRef<FretboardHandle>(null);

  const {
    state, chord, nextButtonRef,
    handleFretClick, handleToggleOpenMute, handleHear,
    handleNext, handleExamNext, handleSubmit, handleClear, handleSkip, handleReset,
  } = useQuizState(grade, mode, fretboardRef);

  // Complete screen (exam mode only)
  if (state.phase === "complete") {
    const maxScore = state.chordQueue.length;
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
            onClick={handleReset}
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
  const isBusy = state.phase === "success" || isSubmitted;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-3">
      <AudioEngine onReady={setAudioFns} />

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
            disabled={isBusy}
            hintsEnabled={!isExam}
          />

          {state.phase === "success" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/50 dark:bg-gray-900/60 backdrop-blur-sm">
              <span className="text-5xl">✓</span>
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">{strings.quiz.correct}</span>
              <button ref={nextButtonRef} onClick={handleNext}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                {strings.quiz.next}
              </button>
            </div>
          )}

          {isSubmitted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/50 dark:bg-gray-900/60 backdrop-blur-sm">
              <span className="text-5xl">{submitCorrect ? "✓" : "✗"}</span>
              <span className={`text-2xl font-bold ${submitCorrect ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}>
                {submitCorrect ? strings.quiz.correct : strings.quiz.incorrect}
              </span>
              <button ref={nextButtonRef} onClick={handleExamNext}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                {strings.quiz.next}
              </button>
            </div>
          )}
        </div>

        <TheoryPanel chord={chord} placedNotes={placedNotes} hintsEnabled={!isExam} />
      </div>

      <div className="flex gap-2">
        <button onClick={handleHear}
          className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
          {strings.quiz.hearChord}
        </button>
        <button onClick={handleClear}
          className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors">
          {strings.quiz.clear}
        </button>
        {isExam ? (
          <>
            <button onClick={handleSubmit} disabled={isSubmitted}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {strings.quiz.submit}
            </button>
            <button onClick={handleSkip} disabled={isSubmitted}
              className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors">
              {strings.quiz.skip}
            </button>
          </>
        ) : (
          <button onClick={handleNext}
            className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors">
            {strings.quiz.skip}
          </button>
        )}
      </div>
    </div>
  );
}
