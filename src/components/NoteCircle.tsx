import type { CSSProperties } from "react";

interface NoteCircleProps {
  label: string;
  bgColor?: string;       // hex fill — if absent, transparent with border
  borderColor?: string;   // hex border colour
  dashed?: boolean;       // dashed border (fret placed state)
  dim?: boolean;          // opacity-30 (non-chord scale notes)
  badge?: string;         // small superscript badge (e.g. "9")
  sublabel?: string;      // text below dot (interval name)
  checked?: boolean;      // show ✓ below dot
  onClick?: () => void;
}

export default function NoteCircle({
  label, bgColor, borderColor, dashed, dim, badge,
  sublabel, checked, onClick,
}: NoteCircleProps) {
  const circleStyle: CSSProperties = {
    backgroundColor: bgColor ?? "transparent",
    borderColor: borderColor ?? "transparent",
    borderStyle: dashed ? "dashed" : "solid",
    borderWidth: bgColor ? 0 : 2,
  };

  return (
    <div
      className={`flex flex-col items-center gap-0.5 transition-opacity ${dim ? "opacity-30" : ""} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="relative">
        <span
          className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold text-white"
          style={circleStyle}
        >
          {label}
        </span>
        {badge && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-amber-400 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-amber-400">
            {badge}
          </span>
        )}
      </div>
      {sublabel !== undefined && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">{sublabel}</span>
      )}
      {checked !== undefined && (
        <span className={`text-[10px] font-bold leading-none transition-all ${checked ? "text-green-500 dark:text-green-400" : "text-transparent"}`}>✓</span>
      )}
    </div>
  );
}
