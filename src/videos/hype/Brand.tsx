// The real Učíme se hrou mark, rebuilt as animated SVG from public/brand/ikona.svg geometry
// (viewBox "5 2.8 120 124.8": four rounded tiles with a darker 3D lip, a white smile + eyes on the
// blue tile, a 12° tilt on the coral tile and a yellow 4-point sparkle top right).
import React from "react";
import { Img, staticFile } from "remotion";
import { ASSET, C, FONT, LOGO_TILES, lip, tile } from "./brand";
import { clamp, ease, pop, seg } from "./motion";

/** One logo tile with its lip, smile and eyes. `drop` 0..1 = how far it has landed. */
export const LogoTile: React.FC<{ k: (typeof LOGO_TILES)[number]; drop?: number; squash?: number }> = ({ k, drop = 1, squash = 0 }) => {
  const { fill, lip: lipCol } = tile(k.key);
  const y = (1 - drop) * -70;
  return (
    <g transform={`rotate(${k.rotate} ${k.x + k.size / 2} ${k.y + k.size / 2})`}>
      <g transform={`translate(0 ${y}) scale(${1 + squash * 0.12} ${1 - squash * 0.12})`}>
        <rect x={k.x} y={k.y + 4.5} width={k.size} height={k.size} rx={k.rx} fill={lipCol} />
        <rect x={k.x} y={k.y} width={k.size} height={k.size} rx={k.rx} fill={fill} />
        {k.smile ? (
          <>
            <path d="M19 36V42A13 13 0 0 0 45 42V36" fill="none" stroke="#fff" strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={23} cy={25} r={4.6} fill="#fff" />
            <circle cx={41} cy={25} r={4.6} fill="#fff" />
          </>
        ) : null}
      </g>
    </g>
  );
};

/** The 4-point sparkle, pops last. */
export const Sparkle: React.FC<{ scale?: number; x?: number; y?: number }> = ({ scale = 1, x = 115, y = 13 }) => (
  <path
    transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}
    d="M115 4.5Q115 13 123.5 13Q115 13 115 21.5Q115 13 106.5 13Q115 13 115 4.5Z"
    fill={C.yellow}
  />
);

/** Animated logo: tiles drop one by one (blue, coral tilts, yellow, green), smile draws, sparkle pops. */
export const LogoReveal: React.FC<{
  d: number;
  scale?: number;
  smileDraw?: boolean;
  onLight?: boolean;
}> = ({ d, scale = 1, smileDraw = true, onLight = false }) => {
  const order = [0, 1, 2, 3];
  const dropAt = [0, 5, 9, 13];
  return (
    <svg viewBox="4 1 122 128" width={420 * scale} height={436 * scale} style={{ overflow: "visible" }}>
      {order.map((i) => {
        const t = LOGO_TILES[i];
        const start = dropAt[i];
        const p = pop(d - start, { damping: 10, stiffness: 230, mass: 0.6 });
        const landed = seg(d - start, 8, 11);
        return (
          <g key={t.key} opacity={d >= start ? 1 : 0}>
            <LogoTile k={t} drop={i === 1 ? ease.back(clamp(p)) : p} squash={(1 - landed) * (d >= start ? 0.35 : 0)} />
          </g>
        );
      })}
      {smileDraw ? (
        <path
          d="M19 36V42A13 13 0 0 0 45 42V36"
          fill="none"
          stroke="#fff"
          strokeWidth={8.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={70}
          strokeDashoffset={70 * (1 - ease.inOut(seg(d, 18, 26)))}
          opacity={d > 16 ? 1 : 0}
          style={{ filter: onLight ? "none" : "drop-shadow(0 0 18px rgba(90,108,255,.55))" }}
        />
      ) : null}
      {[23, 41].map((cx) => (
        <circle key={cx} cx={cx} cy={25} r={4.6 * ease.back(seg(d, 22, 29))} fill="#fff" opacity={d > 20 ? 1 : 0} />
      ))}
      <g opacity={seg(d, 26, 32)} transform={`translate(115 13) scale(${ease.back(seg(d, 26, 33))}) translate(-115 -13)`}>
        <Sparkle />
      </g>
    </svg>
  );
};

/** The wordmark, tracked in after the tiles. Uses the site's own spelling. */
export const Wordmark: React.FC<{ d: number; size?: number; colour?: string; lag?: number }> = ({ d, size = 66, colour = C.cream, lag = 0 }) => {
  const t = seg(d - lag, 0, 18);
  const e = ease.exp(t);
  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: `${(1 - e) * 0.42}em`,
        color: colour,
        opacity: clamp(t * 2),
        whiteSpace: "nowrap",
        transform: `translateY(${(1 - e) * 18}px)`,
        textAlign: "center",
      }}
    >
      učíme se hrou
    </div>
  );
};

/** The site's own logo file, for static end cards (light and dark variants). */
export const LogoImg: React.FC<{ dark?: boolean; width?: number }> = ({ dark = false, width = 760 }) => (
  <Img src={staticFile(dark ? ASSET.logoDarkSvg : ASSET.logoSvg)} style={{ width }} />
);

/** Tagline pill: ucimesehrou.org, flat lip shadow. */
export const TagPill: React.FC<{ d: number; text?: string; bg?: string; fg?: string; size?: number }> = ({
  d,
  text = "ucimesehrou.org",
  bg = C.yellow,
  fg = C.ink,
  size = 52,
}) => {
  const p = pop(d, { damping: 12, stiffness: 200 });
  return (
    <div
      style={{
        display: "inline-block",
        background: bg,
        color: fg,
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: size,
        padding: "18px 40px",
        borderRadius: 999,
        boxShadow: lip(9),
        transform: `scale(${p}) rotate(${(1 - p) * -4}deg)`,
        opacity: clamp(p * 2),
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </div>
  );
};
