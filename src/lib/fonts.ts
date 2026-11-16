import { useEffect, useState } from "react";
import { continueRender, delayRender, getInputProps } from "remotion";
import * as AntonGoogle from "@remotion/google-fonts/Anton";
import * as ArchivoBlackGoogle from "@remotion/google-fonts/ArchivoBlack";
import * as NewsreaderGoogle from "@remotion/google-fonts/Newsreader";
import * as JetBrainsMonoGoogle from "@remotion/google-fonts/JetBrainsMono";
import * as InterGoogle from "@remotion/google-fonts/Inter";

// Bundled local WOFF2 faces matching Google Fonts so offline/firewalled renders also render exact glyphs
import "@fontsource/anton/latin-400.css";
import "@fontsource/archivo-black/latin-400.css";
import "@fontsource/newsreader/latin-400.css";
import "@fontsource/newsreader/latin-400-italic.css";
import "@fontsource/newsreader/latin-500.css";
import "@fontsource/newsreader/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

export const FONTS = {
  anton: `${AntonGoogle.fontFamily}, Impact, sans-serif`,
  archivoBlack: `"${ArchivoBlackGoogle.fontFamily}", Impact, sans-serif`,
  newsreader: `"${NewsreaderGoogle.fontFamily}", Georgia, serif`,
  mono: `"${JetBrainsMonoGoogle.fontFamily}", monospace`,
  sans: `"${InterGoogle.fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`,
} as const;

let googleFontsTriggered = false;

function triggerGoogleFontsLoad(): void {
  if (googleFontsTriggered) return;
  const props = getInputProps() as { offlineFonts?: boolean };
  if (props.offlineFonts) {
    googleFontsTriggered = true;
    return;
  }
  googleFontsTriggered = true;
  AntonGoogle.loadFont("normal", { weights: ["400"], subsets: ["latin"] });
  ArchivoBlackGoogle.loadFont("normal", { weights: ["400"], subsets: ["latin"] });
  NewsreaderGoogle.loadFont("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
  NewsreaderGoogle.loadFont("italic", { weights: ["400"], subsets: ["latin"] });
  JetBrainsMonoGoogle.loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
  InterGoogle.loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
}

/**
 * Ensures both @remotion/google-fonts (online) and @fontsource local WOFF2 faces (offline)
 * have finished rasterizing in document.fonts before any HTML/Canvas frame is captured.
 */
export function useStudioFonts(): void {
  triggerGoogleFontsLoad();
  const [handle] = useState(() =>
    typeof document !== "undefined" ? delayRender("Wait for document.fonts.ready") : null
  );

  useEffect(() => {
    if (handle === null) return;
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        continueRender(handle);
      }
    };
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(finish).catch(finish);
    } else {
      finish();
    }
    return finish;
  }, [handle]);
}
