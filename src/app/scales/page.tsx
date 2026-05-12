import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { strings } from "@/lib/strings";

export default function ScalesHome() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8 transition-colors">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-2">
          <a href="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors">
            ← Back
          </a>
          <ThemeToggle />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-1">Scales</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Select a grade to view scale shapes</p>

        <div className="flex flex-col gap-3">
          {strings.scaleGrades.map(({ grade, label, desc }) => (
            <Link
              key={grade}
              href={`/scales/${grade}`}
              className="block p-5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors group border border-gray-200 dark:border-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {label}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{desc}</p>
                </div>
                <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xl">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
