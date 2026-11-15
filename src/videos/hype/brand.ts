// Brand kit for the Učíme se hrou "HypeShort" — single source of truth.
// Colours, tiles, type and shape rules are taken from the real site (src/app/globals.css of
// lukastmasek-create/umime-skola) and the real logo SVGs in public/brand/. Nothing here is
// invented: the tile geometry below mirrors public/brand/ikona.svg (viewBox "5 2.8 120 124.8").
export const C = {
  blue: "#3248f0",
  blueLip: "#2433b8",
  coral: "#ff5a3c",
  coralLip: "#d63f24",
  yellow: "#ffc933",
  yellowLip: "#dca200",
  green: "#17a864",
  greenLip: "#0e7d48",
  sky: "#29a3ff",
  violet: "#6250d6",
  // light palette
  cream: "#f6f4ee",
  ink: "#16132b",
  muted: "#4f4a66",
  surface: "#ffffff",
  border: "#e0dccf",
  // dark palette
  indigo: "#12102a",
  deep: "#0c0a24",
  darkSurface: "#1c1936",
  darkBorder: "#35305f",
  glow: "#5a6cff",
} as const;

export type BrandKey = "blue" | "coral" | "yellow" | "green";
/** echo copies cycle in this order */
export const TILE_ORDER: BrandKey[] = ["blue", "coral", "yellow", "green"];
export const tile = (k: BrandKey) => ({ fill: C[k], lip: C[`${k}Lip` as const] });

/** Which ink colour reads on a given background. */
export const inkOn = (bg: string) =>
  bg === C.blue || bg === C.indigo || bg === C.deep || bg === C.violet || bg === C.coral ? C.cream : C.ink;

/** Backgrounds alternate hard every 1-3 beats (blue / cream / coral / indigo). */
export const BG = { blue: C.blue, cream: C.cream, coral: C.coral, indigo: C.indigo, deep: C.deep } as const;

/** Flat "3D lip": a hard offset shadow, never a soft blur. Every card, button, chip and tile uses it. */
export const lip = (px: number, colour: string = C.ink) => `${px}px ${px}px 0 0 ${colour}`;

export const radius = { card: 44, chip: 999, tile: 0.3 };

/** The four logo tiles, in the order the logo drops them in. Geometry copied from ikona.svg. */
export const LOGO_TILES = [
  { key: "blue" as BrandKey, x: 7, y: 13, size: 50, rx: 15, rotate: 0, smile: true },
  { key: "coral" as BrandKey, x: 68, y: 8, size: 50, rx: 15, rotate: 12, smile: false },
  { key: "yellow" as BrandKey, x: 7, y: 71, size: 50, rx: 15, rotate: 0, smile: false },
  { key: "green" as BrandKey, x: 67, y: 71, size: 50, rx: 15, rotate: 0, smile: false },
];

export const FONT = {
  /** Unbounded 800 — big kinetic words (latin-ext, so Czech diacritics work) */
  display: "'Unbounded', 'Arial Black', system-ui, sans-serif",
  /** Onest — body / UI text, same family as the site */
  body: "'Onest', system-ui, sans-serif",
  /** Pangolin — the one handwritten irony line */
  hand: "'Pangolin', 'Segoe Print', cursive",
  /** JetBrains Mono — code-lesson UI */
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/** Static assets served by Remotion (staticFile). All pulled from the real site's public/. */
export const ASSET = {
  logoSvg: "brand/logo.svg",
  logoDarkSvg: "brand/logo-tmave.svg",
  iconSvg: "brand/ikona.svg",
  screens: {
    farma: "hype/screens/farma.webp",
    mesto: "hype/screens/mesto.webp",
    mazlicci: "hype/screens/mazlicci.webp",
    zakladna: "hype/screens/zakladna.webp",
    ekonomika: "hype/screens/ekonomika.webp",
  },
  pets: {
    cat: "hype/pets/cat-happy.webp",
    dog: "hype/pets/dog-happy.webp",
    fox: "hype/pets/fox-happy.webp",
    panda: "hype/pets/panda-happy.webp",
    dragon: "hype/pets/dragon-happy.webp",
    bunny: "hype/pets/bunny-happy.webp",
  },
  rewards: {
    trophy: "hype/rewards/pohar_zlato.webp",
    medal: "hype/rewards/medaile_zlato.webp",
    badge: "hype/rewards/odznak_zlato.webp",
    coin: "hype/rewards/mince.webp",
    chest: "hype/rewards/truhla.webp",
    wheel: "hype/rewards/kolo.webp",
  },
  avatars: {
    astronaut: "hype/avatars/astronaut.webp",
    wizard: "hype/avatars/wizard.webp",
    ninja: "hype/avatars/ninja.webp",
  },
  escapes: {
    kitchen: "hype/escapes/kitchen.webp",
    lab: "hype/escapes/lab.webp",
    castle: "hype/escapes/castle.webp",
  },
  shop: {
    frame: "hype/shop/frame.svg",
    limited: "hype/shop/limited.svg",
    pet: "hype/shop/pet.svg",
    city: "hype/shop/city.svg",
  },
  room: "hype/room.webp",
  subjects: {
    maths: "hype/subjects/matematika.webp",
    english: "hype/subjects/anglictina.webp",
    czech: "hype/subjects/cestina.webp",
    history: "hype/subjects/dejepis.webp",
  },
} as const;

/** The film. 1080x1920, 30 fps. */
export const FILM = { width: 1080, height: 1920, fps: 30 } as const;
/** Brand sound: bass-heavy electronic trailer beat at 128 bpm — 1 beat = 14.06 frames at 30 fps. */
export const BPM = 128;
export const beatFrames = (FILM.fps * 60) / BPM; // 14.0625 f
