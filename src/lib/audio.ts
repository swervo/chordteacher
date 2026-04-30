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

export function playMuteSound(): void {
  try {
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // noise that decays very quickly
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 8);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // ignore if audio context unavailable
  }
}
