"use client";

import { useEffect, useState } from "react";

export type Mode = "practice" | "exam";

export function useMode() {
  const [mode, setMode] = useState<Mode>("practice");

  useEffect(() => {
    const stored = localStorage.getItem("mode");
    if (stored === "exam" || stored === "practice") setMode(stored);
  }, []);

  function toggleMode() {
    const next: Mode = mode === "practice" ? "exam" : "practice";
    setMode(next);
    localStorage.setItem("mode", next);
  }

  return { mode, toggleMode };
}
