// Fonts for HypeShort. The prompt asked for @remotion/google-fonts, but that package downloads
// font files from fonts.gstatic.com at render time, and this sandbox can only reach github/npm/PyPI.
// The same four families are installed from npm (@fontsource/*) and loaded here with a delayRender
// guard, so nothing depends on a network fetch or on the system having the font.
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

type Face = { family: string; weight: string; file: string };
const FACES: Face[] = [
  // Unbounded 800 + 900: the big kinetic words (latin-ext covers ě, č, ř, ž…)
  { family: "Unbounded", weight: "800", file: "hype/fonts/unbounded-latin-ext-800.woff2" },
  { family: "Unbounded", weight: "800", file: "hype/fonts/unbounded-latin-800.woff2" },
  { family: "Unbounded", weight: "900", file: "hype/fonts/unbounded-latin-ext-900.woff2" },
  { family: "Unbounded", weight: "900", file: "hype/fonts/unbounded-latin-900.woff2" },
  // Onest: body / UI (400, 500, 700, 800)
  { family: "Onest", weight: "400", file: "hype/fonts/onest-latin-ext-400.woff2" },
  { family: "Onest", weight: "400", file: "hype/fonts/onest-latin-400.woff2" },
  { family: "Onest", weight: "700", file: "hype/fonts/onest-latin-ext-700.woff2" },
  { family: "Onest", weight: "700", file: "hype/fonts/onest-latin-700.woff2" },
  { family: "Onest", weight: "800", file: "hype/fonts/onest-latin-ext-800.woff2" },
  { family: "Onest", weight: "800", file: "hype/fonts/onest-latin-800.woff2" },
  // Pangolin: the one handwritten irony line
  { family: "Pangolin", weight: "400", file: "hype/fonts/pangolin-latin-ext-400.woff2" },
  { family: "Pangolin", weight: "400", file: "hype/fonts/pangolin-latin-400.woff2" },
  // JetBrains Mono: code-lesson UI
  { family: "JetBrains Mono", weight: "500", file: "hype/fonts/jetbrains-mono-latin-500.woff2" },
  { family: "JetBrains Mono", weight: "700", file: "hype/fonts/jetbrains-mono-latin-700.woff2" },
];

let started: Promise<void> | null = null;
const load = () => {
  if (started) return started;
  started = Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, {
        weight: f.weight,
        style: "normal",
        display: "block",
      });
      await face.load();
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    }),
  ).then(() => undefined);
  return started;
};

/** Block the frame until the brand fonts are usable. Call once, at the top of the composition. */
export const useBrandFonts = () => {
  const [handle] = useState(() => delayRender("hype fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    load().then(() => {
      if (!live) return;
      setReady(true);
      continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
};
