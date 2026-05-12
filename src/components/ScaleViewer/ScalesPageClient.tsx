"use client";

import type { ScaleDefinition } from "@/types/chord";
import { useMode } from "@/lib/useMode";
import ScaleViewer from "./ScaleViewer";
import ScaleTrainer from "@/components/ScaleTrainer/ScaleTrainer";

interface ScalesPageClientProps {
  scales: ScaleDefinition[];
}

export default function ScalesPageClient({ scales }: ScalesPageClientProps) {
  const { mode } = useMode("scales");

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full">
      {mode === "exam" ? (
        <ScaleTrainer scales={scales} />
      ) : (
        <ScaleViewer scales={scales} />
      )}
    </div>
  );
}
