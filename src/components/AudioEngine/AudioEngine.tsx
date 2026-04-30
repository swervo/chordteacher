"use client";

import { useEffect } from "react";
import type { StringFingering, StringNumber } from "@/types/chord";

interface AudioEngineProps {
  onReady: (
    strum: (fingering: StringFingering[]) => Promise<void>,
    pluck: (string: StringNumber, fret: number) => Promise<void>,
    mute: () => void
  ) => void;
}

export default function AudioEngine({ onReady }: AudioEngineProps) {
  useEffect(() => {
    const { strumChord, pluckNote, playMuteSound } = require("@/lib/audio");
    onReady(strumChord, pluckNote, playMuteSound);
  }, [onReady]);

  return null;
}
