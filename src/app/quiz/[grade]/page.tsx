import { redirect } from "next/navigation";
import type { GradeNumber } from "@/types/chord";
import QuizControllerClient from "@/components/QuizController/QuizControllerClient";
import ThemeToggle from "@/components/ThemeToggle";
import { strings } from "@/lib/strings";

interface Props {
  params: Promise<{ grade: string }>;
}

export default async function QuizPage({ params }: Props) {
  const { grade: gradeStr } = await params;
  const grade = parseInt(gradeStr);
  if (![1, 2, 3, 4].includes(grade)) redirect("/");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-2 transition-colors">
      <div className="max-w-2xl mx-auto px-3">
        <div className="mb-2 flex items-center justify-between">
          <a href="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors">
            {strings.quiz.backToGrades}
          </a>
          <ThemeToggle />
        </div>
        <QuizControllerClient grade={grade as GradeNumber} />
      </div>
    </main>
  );
}
