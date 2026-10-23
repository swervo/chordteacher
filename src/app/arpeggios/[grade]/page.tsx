import { redirect } from "next/navigation";
import Link from "next/link";
import type { GradeNumber } from "@/types/chord";
import { getArpeggiosForGrade } from "@/data/index";
import ArpeggiosPageClient from "@/components/ArpeggioViewer/ArpeggiosPageClient";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  params: Promise<{ grade: string }>;
}

export default async function ArpeggiosPage({ params }: Props) {
  const { grade: gradeStr } = await params;
  const grade = parseInt(gradeStr);
  const arpeggios = getArpeggiosForGrade(grade as GradeNumber);
  if (arpeggios.length === 0) redirect("/arpeggios");

  return (
    <main className="h-dvh flex flex-col bg-gray-50 dark:bg-gray-900 py-2 transition-colors">
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-3 min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/arpeggios" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors">
            ← Back to grades
          </Link>
          <ThemeToggle />
        </div>
        <ArpeggiosPageClient arpeggios={arpeggios} />
      </div>
    </main>
  );
}
