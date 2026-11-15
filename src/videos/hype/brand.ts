/** Učíme se hrou brand tokens: single source of truth (from umime-skola src/app/globals.css + public/brand). */
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import { loadFont as loadPangolin } from "@remotion/google-fonts/Pangolin";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const C = {
  cream: "#f6f4ee", ink: "#16132b", muted: "#4f4a66", surface: "#ffffff", border: "#e0dccf",
  indigo: "#12102a", deep: "#0c0a24", text: "#f6f1e4", dsurface: "#1c1936", dborder: "#35305f", glow: "#5a6cff",
  blue: "#3248f0", blueLip: "#2433b8", coral: "#ff5a3c", coralLip: "#d63f24", yellow: "#ffc933", yellowLip: "#dca200",
  green: "#17a864", greenLip: "#0e7d48", sky: "#29a3ff", violet: "#6250d6",
} as const;
export const TILE = [C.blue, C.coral, C.yellow, C.green] as const;
export const LIP = [C.blueLip, C.coralLip, C.yellowLip, C.greenLip] as const;
export const FPS = 30;
export const W = 1080;
export const H = 1920;

const u = loadUnbounded("normal", { weights: ["800"], subsets: ["latin", "latin-ext"] });
const o = loadOnest("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });
const p = loadPangolin("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const m = loadMono("normal", { weights: ["500"], subsets: ["latin"] });
export const FONT = { big: u.fontFamily, body: o.fontFamily, hand: p.fontFamily, mono: m.fontFamily };
export const fontsReady = Promise.all([u.waitUntilDone(), o.waitUntilDone(), p.waitUntilDone(), m.waitUntilDone()]);
export const PROMPT_GRADIENT = `linear-gradient(135deg, ${C.blue}, ${C.violet})`;
/** flat, hard offset "lip" shadow used by every tile/card/button */
export const lip = (color: string, d = 10) => `0 ${d}px 0 ${color}`;
