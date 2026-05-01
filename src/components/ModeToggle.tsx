"use client";

import { useMode } from "@/lib/useMode";

export default function ModeToggle() {
  const { mode, toggleMode } = useMode();
  const isExam = mode === "exam";

  return (
    <button
      role="switch"
      aria-checked={isExam}
      aria-label="Toggle exam mode"
      onClick={toggleMode}
      className="flex items-center gap-3 group"
    >
      <span className={`text-sm font-medium transition-colors ${!isExam ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
        Practice
      </span>
      <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isExam ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isExam ? "translate-x-6" : "translate-x-0"}`} />
      </div>
      <span className={`text-sm font-medium transition-colors ${isExam ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
        Exam
      </span>
    </button>
  );
}
