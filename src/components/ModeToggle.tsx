"use client";

import { useMode } from "@/lib/useMode";

export default function ModeToggle() {
  const { mode, toggleMode } = useMode();

  return (
    <button
      onClick={toggleMode}
      aria-label={`Switch to ${mode === "practice" ? "exam" : "practice"} mode`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
        border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        text-gray-600 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {mode === "practice" ? "✏️ Practice" : "📝 Exam"}
    </button>
  );
}
