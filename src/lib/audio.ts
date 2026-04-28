import type { StringFingering, StringNumber } from "@/types/chord";
import { noteAtFret } from "./fretboard";

let synth: import("tone").PolySynth | null = null;

async function getSynth() {
  const Tone = await import("tone");
  await Tone.start();
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1.2 },
    }).toDestination();
  }
  return { synth, Tone };
}

export async function strumChord(fingering: StringFingering[]): Promise<void> {
  const { synth: s, Tone } = await getSynth();
  const STAGGER = 0.03; // 30ms between strings

  const sorted = [...fingering]
    .filter((f) => !f.muted && f.fret !== null)
    .sort((a, b) => b.string - a.string); // low E first

  const now = Tone.now();
  sorted.forEach((f, i) => {
    const note = noteAtFret(f.string as StringNumber, f.fret as number);
    s.triggerAttackRelease(note, "2n", now + i * STAGGER);
  });
}

export async function pluckNote(string: StringNumber, fret: number): Promise<void> {
  const { synth: s, Tone } = await getSynth();
  const note = noteAtFret(string, fret);
  s.triggerAttackRelease(note, "8n", Tone.now());
}
