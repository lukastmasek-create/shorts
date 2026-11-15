/** Shot list. Voice cues come from cues.json (voice_hype.py): scene i starts exactly on voice line i.
 *  Tweak a scene: change `bg`, `kind`, or `tin` (transition INTO that scene). See README.md. */
import raw from "./cues.json";
import shots from "./shots.json";
import { C } from "./brand";

export type TIn = "cut" | "whip" | "zoom" | "glitch" | "stripes" | "flash" | "laser" | "shape";
export type Kind =
  | "nowway" | "homework" | "worksheets" | "timers" | "study" | "boring" | "ask" | "better" | "meet" | "tagline"
  | "pick" | "answer" | "points" | "levelup" | "quiz" | "five" | "farm" | "city" | "pets" | "escape" | "board"
  | "kidding" | "practice" | "teachers" | "register" | "play" | "end";
export type Scene = { lead: number; i: number; from: number; dur: number; text: string; kind: Kind; bg: string; tin: TIn; tdur: number; dark?: boolean };

const KINDS = shots as [Kind, keyof typeof C, TIn, number][];
const dark = new Set<string>([C.indigo, C.blue, C.coral, C.green]);
export const TOTAL: number = raw.total;
export const SCENES: Scene[] = raw.cues.map((c, i) => {
  const next = raw.cues[i + 1]?.from ?? raw.total;
  const [kind, bgName, tin, tdur] = KINDS[i];
  const bg: string = C[bgName];
  const from = i === 0 ? 0 : c.from;
  return { lead: i === 0 ? raw.cues[0].from : tdur, i, from, dur: next - from, text: c.text, kind, bg, tin, tdur, dark: dark.has(bg) };
});
