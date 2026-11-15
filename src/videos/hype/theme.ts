// Design tokens for the HROU promo (1080x1920, 30 fps). Everything the film draws reads from here.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  black: "#050507",
  white: "#EDEDF0",
  red: "#FF3B1F",
  deep: "#8E1206",
  glow: "#FF2A0F",
  orange: "#FF7A1A",
  blueA: "#3B4BE0",
  blueB: "#8A3BE0",
  acid: "#F2FF1F",
  ink: "#0A0A0C",
} as const;

export const F = {
  display: '"Archivo Black", "Arial Black", Impact, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  serif: '"Playfair Display", Georgia, serif',
} as const;

/** rgba() from one of the palette hexes, so shaders/CSS glows can share the tokens. */
export const rgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
