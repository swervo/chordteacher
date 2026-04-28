"use client";

import { useEffect } from "react";
import type { StringFingering, StringNumber } from "@/types/chord";

interface AudioEngineProps {
  onReady: (
    strum: (fingering: StringFingering[]) => Promise<void>,
    pluck: (string: StringNumber, fret: number) => Promise<void>
  ) => void;
}

export default function AudioEngine({ onReady }: AudioEngineProps) {
  useEffect(() => {
    const { strumChord, pluckNote } = require("@/lib/audio");
    onReady(strumChord, pluckNote);
  }, [onReady]);

  return null;
}
