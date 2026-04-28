import { redirect } from "next/navigation";
import type { GradeNumber } from "@/types/chord";
import QuizControllerClient from "@/components/QuizController/QuizControllerClient";

interface Props {
  params: Promise<{ grade: string }>;
}

export default async function QuizPage({ params }: Props) {
  const { grade: gradeStr } = await params;
  const grade = parseInt(gradeStr);
  if (![1, 2, 3, 4].includes(grade)) redirect("/");

  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to grades
          </a>
        </div>
        <QuizControllerClient grade={grade as GradeNumber} />
      </div>
    </main>
  );
}
