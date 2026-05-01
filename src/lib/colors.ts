export const COLOR_GRAY = "#6b7280";

const C = {
  red:    "#ef4444",
  blue:   "#3b82f6",
  violet: "#8b5cf6",
  green:  "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  amber:  "#f59e0b",
} as const;

export const INTERVAL_COLORS: Record<number, string> = {
  0: C.red, 4: C.blue, 3: C.violet, 7: C.green,
  11: C.purple, 10: C.orange, 2: C.amber, 5: C.amber, 9: C.amber,
};

export const INTERVAL_COLOR_BY_LABEL: Record<string, string> = {
  R: C.red, "3": C.blue, "m3": C.violet, "5": C.green,
  "maj7": C.purple, "7": C.orange, "2": C.amber, "4": C.amber, "6": C.amber,
};
