"use client";

import dynamic from "next/dynamic";
import type { GradeNumber } from "@/types/chord";
import { useMode } from "@/lib/useMode";

const QuizController = dynamic(() => import("./QuizController"), { ssr: false });

export default function QuizControllerClient({ grade }: { grade: GradeNumber }) {
  const { mode } = useMode();
  return <QuizController grade={grade} mode={mode} />;
}
