"use client";

import { useState } from "react";
import type { ScaleDefinition } from "@/types/chord";
import Fretboard from "@/components/Fretboard/Fretboard";

interface ScaleViewerProps {
  scales: ScaleDefinition[];
}

export default function ScaleViewer({ scales }: ScaleViewerProps) {
  const [index, setIndex] = useState(0);
  const scale = scales[index];

  if (!scale) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-3">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{scale.name}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">{index + 1} / {scales.length}</p>
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(i + 1, scales.length - 1))}
          disabled={index === scales.length - 1}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          →
        </button>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-sm mx-auto">
        <Fretboard scaleNotes={scale.notes} scaleRoot={scale.root} />
      </div>
    </div>
  );
}
