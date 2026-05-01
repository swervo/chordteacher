"use client";

import { useCallback, useRef, useEffect } from "react";
import { useMachine } from "@xstate/react";
import type { StringNumber } from "@/types/chord";
import type { Mode } from "@/lib/useMode";
import type { GradeNumber } from "@/types/chord";
import type { FretboardHandle } from "@/components/Fretboard/Fretboard";
import type { ChordDefinition } from "@/types/chord";
import { quizMachine } from "./quizMachine";

// ─── Audio refs ───────────────────────────────────────────────────────────────

type Fingering = ChordDefinition["fingerings"][number];
let strumChordFn: ((fingering: Fingering) => Promise<void>) | null = null;
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuizState(grade: GradeNumber, mode: Mode, fretboardRef: React.RefObject<FretboardHandle | null>) {
  const [snapshot, send] = useMachine(quizMachine, { input: { grade, mode } });
  const { context } = snapshot;
  const chord = context.chordQueue[context.currentIndex];
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Focus and audio side effects on phase transitions
  useEffect(() => {
    if (snapshot.matches("success")) {
      if (strumChordFn && chord) strumChordFn(chord.fingerings[0]);
      nextButtonRef.current?.focus();
    }
    if (snapshot.matches("submitted")) {
      if (context.validationResult === "correct" && strumChordFn && chord) strumChordFn(chord.fingerings[0]);
      nextButtonRef.current?.focus();
    }
  }, [snapshot.value, chord]);

  const handleFretClick = useCallback((string: StringNumber, fret: number) => {
    if (snapshot.matches("success") || snapshot.matches("submitted")) return;
    send({ type: "PLACE_NOTE", string, fret });
    pluckNoteFn?.(string, fret);
  }, [snapshot.value, send]);

  const handleToggleOpenMute = useCallback((string: StringNumber) => {
    if (snapshot.matches("success") || snapshot.matches("submitted")) return;
    send({ type: "TOGGLE_OPEN_MUTE", string, pluck: (s, f) => pluckNoteFn?.(s, f), mute: () => muteSoundFn?.() });
  }, [snapshot.value, send]);

  const handleHear = useCallback(() => {
    if (chord && strumChordFn) strumChordFn(chord.fingerings[0]);
  }, [chord]);

  const handleNext = useCallback(() => {
    send({ type: "NEXT_CHORD" });
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, [send, fretboardRef]);

  const handleExamNext = useCallback(() => {
    send({ type: "ADVANCE" });
    setTimeout(() => fretboardRef.current?.focusFirstCell(), 0);
  }, [send, fretboardRef]);

  const handleSubmit = useCallback(() => send({ type: "SUBMIT" }), [send]);
  const handleClear = useCallback(() => send({ type: "CLEAR" }), [send]);
  const handleSkip = useCallback(() => send({ type: "SKIP" }), [send]);
  const handleReset = useCallback(() => send({ type: "RESET" }), [send]);

  return {
    state: { ...context, phase: snapshot.value as "quiz" | "success" | "submitted" | "complete" },
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
