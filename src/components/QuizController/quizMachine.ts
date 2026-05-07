import { setup, assign } from "xstate";
import type { ChordDefinition, GradeNumber, StringNumber, StringState, StringStates, ValidationResult } from "@/types/chord";
import { getChordsForGrade, shuffleChords } from "@/data/index";
import { validateAnswer } from "@/lib/validation";
import type { Mode } from "@/lib/useMode";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_STRINGS: StringNumber[] = [1, 2, 3, 4, 5, 6];

export function allOpen(): StringStates {
  return Object.fromEntries(ALL_STRINGS.map((s) => [s, { kind: "open" }])) as StringStates;
}

export function allSelectedOpen(): StringStates {
  return Object.fromEntries(ALL_STRINGS.map((s) => [s, { kind: "fret", fret: 0 }])) as StringStates;
}

export function buildQueue(grade: GradeNumber): ChordDefinition[] {
  return shuffleChords(getChordsForGrade(grade));
}

function initialStringStates(mode: Mode): StringStates {
  return mode === "exam" ? allSelectedOpen() : allOpen();
}

function nextStringState(current: StringStates[StringNumber], string: StringNumber, fret: number, mode: Mode): StringState {
  return (current.kind === "fret" && current.fret === fret)
    ? (mode === "exam" ? { kind: "fret", fret: 0 } : { kind: "open" })
    : { kind: "fret", fret };
}

// ─── Context, Events, Input ───────────────────────────────────────────────────

export interface QuizContext {
  grade: GradeNumber;
  mode: Mode;
  chordQueue: ChordDefinition[];
  currentIndex: number;
  stringStates: StringStates;
  validationResult: ValidationResult | null;
  score: number;
  skippedChords: ChordDefinition[];
}

export interface QuizInput {
  grade: GradeNumber;
  mode: Mode;
}

export type QuizEvent =
  | { type: "PLACE_NOTE"; string: StringNumber; fret: number }
  | { type: "TOGGLE_OPEN_MUTE"; string: StringNumber; pluck: (s: StringNumber, f: number) => void; mute: () => void }
  | { type: "SUBMIT" }
  | { type: "NEXT_CHORD" }
  | { type: "SKIP" }
  | { type: "ADVANCE" }
  | { type: "CLEAR" }
  | { type: "RESET" };

// ─── Machine ──────────────────────────────────────────────────────────────────

export const quizMachine = setup({
  types: {
    context: {} as QuizContext,
    events: {} as QuizEvent,
    input: {} as QuizInput,
  },

  guards: {
    isExam: ({ context }) => context.mode === "exam",

    practiceNoteCorrect: ({ context, event }) => {
      if (event.type !== "PLACE_NOTE") return false;
      const next = nextStringState(context.stringStates[event.string], event.string, event.fret, "practice");
      const updated = { ...context.stringStates, [event.string]: next };
      return validateAnswer(updated, context.chordQueue[context.currentIndex]) === "correct";
    },

    practiceToggleCorrect: ({ context, event }) => {
      if (event.type !== "TOGGLE_OPEN_MUTE") return false;
      const current = context.stringStates[event.string];
      let next: StringState;
      if (current.kind === "open") next = { kind: "fret", fret: 0 };
      else if (current.kind === "fret" && current.fret === 0) next = { kind: "muted" };
      else next = { kind: "open" };
      const updated = { ...context.stringStates, [event.string]: next };
      return validateAnswer(updated, context.chordQueue[context.currentIndex]) === "correct";
    },

    isLastChord: ({ context }) => context.currentIndex + 1 >= context.chordQueue.length,
  },

  actions: {
    placeNote: assign(({ context, event }) => {
      if (event.type !== "PLACE_NOTE") return {};
      const next = nextStringState(context.stringStates[event.string], event.string, event.fret, context.mode);
      return { stringStates: { ...context.stringStates, [event.string]: next } };
    }),

    placeNoteAndValidate: assign(({ context, event }) => {
      if (event.type !== "PLACE_NOTE") return {};
      const next = nextStringState(context.stringStates[event.string], event.string, event.fret, "practice");
      const updated = { ...context.stringStates, [event.string]: next };
      const result = validateAnswer(updated, context.chordQueue[context.currentIndex]);
      return {
        stringStates: updated,
        validationResult: result,
        score: result === "correct" ? context.score + 1 : context.score,
      };
    }),

    toggleOpenMute: assign(({ context, event }) => {
      if (event.type !== "TOGGLE_OPEN_MUTE") return {};
      const current = context.stringStates[event.string];
      let next: StringState;
      if (current.kind === "open") {
        next = { kind: "fret", fret: 0 };
        event.pluck(event.string, 0);
      } else if (current.kind === "fret" && current.fret === 0) {
        next = { kind: "muted" };
        event.mute();
      } else if (current.kind === "muted") {
        next = { kind: "open" };
      } else {
        next = { kind: "open" };
      }
      return { stringStates: { ...context.stringStates, [event.string]: next } };
    }),

    toggleOpenMuteAndValidate: assign(({ context, event }) => {
      if (event.type !== "TOGGLE_OPEN_MUTE") return {};
      const current = context.stringStates[event.string];
      let next: StringState;
      if (current.kind === "open") {
        next = { kind: "fret", fret: 0 };
        event.pluck(event.string, 0);
      } else if (current.kind === "fret" && current.fret === 0) {
        next = { kind: "muted" };
        event.mute();
      } else {
        next = { kind: "open" };
      }
      const updated = { ...context.stringStates, [event.string]: next };
      const result = validateAnswer(updated, context.chordQueue[context.currentIndex]);
      return {
        stringStates: updated,
        validationResult: result,
        score: result === "correct" ? context.score + 1 : context.score,
      };
    }),

    recordValidation: assign(({ context }) => {
      const result = validateAnswer(context.stringStates, context.chordQueue[context.currentIndex]);
      return {
        validationResult: result,
        score: result === "correct" ? context.score + 1 : context.score,
      };
    }),

    advanceToNext: assign(({ context }) => ({
      currentIndex: context.currentIndex + 1,
      stringStates: initialStringStates(context.mode),
      validationResult: null,
    })),

    recordSkip: assign(({ context }) => ({
      skippedChords: [...context.skippedChords, context.chordQueue[context.currentIndex]],
    })),

    nextChordPractice: assign(({ context }) => {
      const nextIndex = (context.currentIndex + 1) % context.chordQueue.length;
      const reshuffled = nextIndex === 0 ? shuffleChords(context.chordQueue) : context.chordQueue;
      return { chordQueue: reshuffled, currentIndex: nextIndex, stringStates: allOpen(), validationResult: null };
    }),

    clearBoard: assign(({ context }) => ({
      stringStates: initialStringStates(context.mode),
      validationResult: null,
    })),

    reset: assign(({ context }) => ({
      chordQueue: buildQueue(context.grade),
      currentIndex: 0,
      stringStates: initialStringStates(context.mode),
      validationResult: null,
      score: 0,
      skippedChords: [],
    })),
  },
}).createMachine({
  id: "quiz",
  initial: "quiz",

  context: ({ input }) => ({
    grade: input.grade,
    mode: input.mode,
    chordQueue: buildQueue(input.grade),
    currentIndex: 0,
    stringStates: initialStringStates(input.mode),
    validationResult: null,
    score: 0,
    skippedChords: [],
  }),

  states: {
    // ── Actively answering a chord ────────────────────────────────────────────
    quiz: {
      on: {
        PLACE_NOTE: [
          // Exam: just update state, no validation
          { guard: "isExam", actions: "placeNote" },
          // Practice: update + validate → success if correct
          { guard: "practiceNoteCorrect", actions: "placeNoteAndValidate", target: "success" },
          // Practice: update + validate, stay in quiz
          { actions: "placeNoteAndValidate" },
        ],
        TOGGLE_OPEN_MUTE: [
          { guard: "isExam", actions: "toggleOpenMute" },
          { guard: "practiceToggleCorrect", actions: "toggleOpenMuteAndValidate", target: "success" },
          { actions: "toggleOpenMuteAndValidate" },
        ],
        SUBMIT: { guard: "isExam", target: "submitted", actions: "recordValidation" },
        SKIP: [
          { guard: "isLastChord", actions: ["recordSkip", "advanceToNext"], target: "complete" },
          { actions: ["recordSkip", "advanceToNext"] },
        ],
        NEXT_CHORD: { actions: "nextChordPractice" },
        CLEAR: { actions: "clearBoard" },
        RESET: { actions: "reset" },
      },
    },

    // ── Practice: correct answer shown ────────────────────────────────────────
    success: {
      on: {
        NEXT_CHORD: { target: "quiz", actions: "nextChordPractice" },
        RESET: { target: "quiz", actions: "reset" },
      },
    },

    // ── Exam: submitted, awaiting Next ────────────────────────────────────────
    submitted: {
      on: {
        ADVANCE: [
          { guard: "isLastChord", actions: "advanceToNext", target: "complete" },
          { actions: "advanceToNext", target: "quiz" },
        ],
        SKIP: [
          { guard: "isLastChord", actions: ["recordSkip", "advanceToNext"], target: "complete" },
          { actions: ["recordSkip", "advanceToNext"], target: "quiz" },
        ],
        RESET: { target: "quiz", actions: "reset" },
      },
    },

    // ── Exam: all chords done ─────────────────────────────────────────────────
    complete: {
      on: {
        RESET: { target: "quiz", actions: "reset" },
      },
    },
  },
});
