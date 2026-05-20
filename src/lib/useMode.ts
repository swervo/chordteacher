"use client";

import { useState } from "react";

export type Mode = "practice" | "exam";

export function useMode(topic: string = "chords") {
  const key = `mode:${topic}`;
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "practice";
    const stored = localStorage.getItem(key);
    return stored === "exam" || stored === "practice" ? stored : "practice";
  });

  function toggleMode() {
    const next: Mode = mode === "practice" ? "exam" : "practice";
    setMode(next);
    localStorage.setItem(key, next);
  }

  return { mode, toggleMode };
}
