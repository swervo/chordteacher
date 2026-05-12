"use client";

import { useEffect, useState } from "react";

export type Mode = "practice" | "exam";

export function useMode(topic: string = "chords") {
  const key = `mode:${topic}`;
  const [mode, setMode] = useState<Mode>("practice");

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored === "exam" || stored === "practice") setMode(stored);
  }, [key]);

  function toggleMode() {
    const next: Mode = mode === "practice" ? "exam" : "practice";
    setMode(next);
    localStorage.setItem(key, next);
  }

  return { mode, toggleMode };
}
