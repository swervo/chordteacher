"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Note } from "tonal";
import type { ScaleDefinition, StringNumber } from "@/types/chord";
import Fretboard from "@/components/Fretboard/Fretboard";
import IntervalStrip from "./IntervalStrip";
import { noteAtFret } from "@/lib/fretboard";
import { validateScalePlaced } from "@/lib/validation";

interface ScaleTrainerProps {
  scales: ScaleDefinition[];
}

export default function ScaleTrainer({ scales }: ScaleTrainerProps) {
  const [scaleIndex, setScaleIndex] = useState(0);
  const [placedNotes, setPlacedNotes] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"playing" | "correct">("playing");
  const audioRef = useRef<{ playScale: typeof import("@/lib/audio").playScale; pluckNote: typeof import("@/lib/audio").pluckNote } | null>(null);

  const scale = scales[scaleIndex];

  useEffect(() => {
    import("@/lib/audio").then((mod) => {
      audioRef.current = { playScale: mod.playScale, pluckNote: mod.pluckNote };
    });
  }, []);

  const rootNotes = useMemo(() => new Set(
    scale.notes
      .filter((n) => Note.pitchClass(noteAtFret(n.string, n.fret)) === scale.root)
      .map((n) => `${n.string}-${n.fret}`)
  ), [scale]);

  const goToScale = useCallback((index: number) => {
    setScaleIndex(index);
    setPlacedNotes(new Set());
    setPhase("playing");
  }, []);

  const advance = useCallback(() => {
    goToScale((scaleIndex + 1) % scales.length);
  }, [scaleIndex, scales.length, goToScale]);

  const handleFretClick = useCallback((string: StringNumber, fret: number) => {
    if (phase !== "playing") return;
    const key = `${string}-${fret}`;
    setPlacedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        audioRef.current?.pluckNote(string, fret).catch(() => {});
      }
      if (validateScalePlaced(next, scale, rootNotes) === "correct") {
        setPhase("correct");
        setTimeout(() => {
          audioRef.current?.playScale(scale.notes, scale.root).catch(() => {});
        }, 500);
        setTimeout(() => advance(), 2000);
      }
      return next;
    });
  }, [phase, scale, rootNotes, advance]);

  const handleToggleOpenMute = useCallback((string: StringNumber) => {
    if (phase !== "playing") return;
    if (rootNotes.has(`${string}-0`)) return;
    handleFretClick(string, 0);
  }, [phase, rootNotes, handleFretClick]);

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-3">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => goToScale(Math.max(scaleIndex - 1, 0))}
          disabled={scaleIndex === 0}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{scale.name}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">{scaleIndex + 1} / {scales.length}</p>
        </div>
        <button
          onClick={() => goToScale(Math.min(scaleIndex + 1, scales.length - 1))}
          disabled={scaleIndex === scales.length - 1}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          →
        </button>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-sm mx-auto relative">
        {phase === "correct" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/50 dark:bg-gray-900/60 backdrop-blur-sm">
            <span className="text-5xl">✓</span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">Correct!</span>
          </div>
        )}
        <Fretboard
          placedNotes={placedNotes}
          onFretClick={handleFretClick}
          onToggleOpenMute={handleToggleOpenMute}
          rootNotes={rootNotes}
          scaleRoot={scale.root}
          disabled={phase === "correct"}
        />
      </div>

      <div className="w-full max-w-sm mx-auto pb-2">

        <IntervalStrip scale={scale} />
      </div>
    </div>
  );
}
