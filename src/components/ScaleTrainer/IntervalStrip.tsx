import type { ScaleDefinition } from "@/types/chord";
import { noteAtFret, colorForStringFret } from "@/lib/fretboard";
import NoteCircle from "@/components/NoteCircle";
import { Note } from "tonal";

interface IntervalStripProps {
  scale: ScaleDefinition;
}

export default function IntervalStrip({ scale }: IntervalStripProps) {
  const withMidi = scale.notes
    .map((n) => ({
      note: noteAtFret(n.string, n.fret),
      midi: Note.midi(noteAtFret(n.string, n.fret)) ?? 0,
      string: n.string,
      fret: n.fret,
    }))
    .sort((a, b) => a.midi - b.midi);

  const lowestRoot = withMidi.find((n) => Note.pitchClass(n.note) === scale.root);
  const startMidi = lowestRoot?.midi ?? withMidi[0].midi;
  const octave = withMidi.filter((n) => n.midi >= startMidi && n.midi <= startMidi + 12);

  const intervals = octave.slice(0, -1).map((n, i) => {
    const diff = octave[i + 1].midi - n.midi;
    return diff === 1 ? "s" : "T";
  });

  return (
    <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-transparent rounded-xl w-full">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {scale.name}
      </p>
      {/* Note row */}
      <div className="flex gap-1 justify-between items-start">
        {octave.map((n, i) => (
          <NoteCircle
            key={i}
            label={Note.pitchClass(n.note)}
            bgColor={colorForStringFret(scale.root, n.string, n.fret)}
          />
        ))}
      </div>
      {/* Interval row — offset by half a circle width so labels sit between notes */}
      <div className="flex gap-1 justify-between items-start pl-[18px] pr-[18px] mt-0.5">
        {intervals.map((interval, i) => (
          <span
            key={i}
            className="w-9 text-center text-xs font-bold flex-shrink-0"
            style={{ color: interval === "s" ? "#f87171" : "#60a5fa" }}
          >
            {interval}
          </span>
        ))}
      </div>
    </div>
  );
}
