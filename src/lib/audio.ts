import type { StringFingering, StringNumber } from "@/types/chord";
import { noteAtFret } from "./fretboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let player: any = null;

async function getPlayer() {
  if (!player) {
    const Soundfont = (await import("soundfont-player")).default;
    const ctx = new AudioContext();
    player = await Soundfont.instrument(ctx, "acoustic_guitar_steel");
  }
  return player;
}

const STAGGER_MS = 30;

export async function strumChord(fingering: StringFingering[]): Promise<void> {
  const p = await getPlayer();
  const sorted = [...fingering]
    .filter((f) => !f.muted && f.fret !== null)
    .sort((a, b) => b.string - a.string); // low E first

  sorted.forEach((f, i) => {
    const note = noteAtFret(f.string as StringNumber, f.fret as number);
    setTimeout(() => p.play(note), i * STAGGER_MS);
  });
}

export async function pluckNote(string: StringNumber, fret: number): Promise<void> {
  const p = await getPlayer();
  const note = noteAtFret(string, fret);
  p.play(note);
}
