import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const GRADES = [
  { grade: 1, label: "Grade 1", desc: "A, E, D7, A7, E7, B7" },
  { grade: 2, label: "Grade 2", desc: "F, Am7, Em7, Dm7, C7, G7, maj7s" },
  { grade: 3, label: "Grade 3", desc: "sus2 and sus4 chords" },
  { grade: 4, label: "Grade 4", desc: "6th and add9 chords" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8 transition-colors">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ChordTeacher</h1>
          <ThemeToggle />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          LCM Acoustic Guitar — interactive chord quiz with theory feedback
        </p>

        <div className="flex flex-col gap-3">
          {GRADES.map(({ grade, label, desc }) => (
            <Link
              key={grade}
              href={`/quiz/${grade}`}
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

        <p className="text-gray-400 dark:text-gray-600 text-xs mt-10 text-center">
          Click frets on the neck · Theory panel shows scale context
        </p>
      </div>
    </main>
  );
}
