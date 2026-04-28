"use client";

import dynamic from "next/dynamic";
import type { GradeNumber } from "@/types/chord";

const QuizController = dynamic(() => import("./QuizController"), { ssr: false });

export default function QuizControllerClient({ grade }: { grade: GradeNumber }) {
  return <QuizController grade={grade} />;
}
