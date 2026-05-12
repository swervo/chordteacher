import ThemeToggle from "@/components/ThemeToggle";

export default function ArpeggiosHome() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8 transition-colors">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-2">
          <a href="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors">
            ← Back
          </a>
          <ThemeToggle />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-1">Arpeggios</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Coming soon</p>

        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-transparent text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Arpeggio exercises are under development.</p>
        </div>
      </div>
    </main>
  );
}
