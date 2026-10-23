"use client";

import type { ScaleDefinition } from "@/types/chord";
import { useMode } from "@/lib/useMode";
import ScaleViewer from "@/components/ScaleViewer/ScaleViewer";
import ScaleTrainer from "@/components/ScaleTrainer/ScaleTrainer";

interface ArpeggiosPageClientProps {
  arpeggios: ScaleDefinition[];
}

export default function ArpeggiosPageClient({ arpeggios }: ArpeggiosPageClientProps) {
  const { mode } = useMode("arpeggios");

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full">
      {mode === "exam" ? (
        <ScaleTrainer scales={arpeggios} />
      ) : (
        <ScaleViewer scales={arpeggios} />
      )}
    </div>
  );
}
