// The film's script, authored once here. Two generated artefacts come out of it:
//   hype/voice/words.json  (TTS + word times, scripts/hype_voice.py)
//   hype/voice/timing.json (per-beat frames, scripts/hype_timing.py)  -> imported by story.ts
// Every on-screen word is spelled correctly on screen; SAY is what the TTS reads (brand phonetics).
//
// Claims check (only real site claims, from src/i18n/home*.ts + home-lobby.ts of umime-skola):
//   courses with five difficulty levels, an explanation for every answer, farm / city / pets,
//   escape rooms, daily quiz, review, leaderboards, shop with frames and rewards, code lessons
//   (HTML/CSS/JS, one line at a time — that page is Czech-only, so the words stay on screen),
//   free registration ("Free to start" = registration is free; the site also has a Pro tier),
//   8 languages (src/i18n/config.ts: cs en de ru uk ja es fr).
// NOT claimed: any price, paid pack, count of exercises/users, "no ads", parent dashboard.

export type Mode = "slam" | "stretch" | "scramble" | "extrude" | "outline-echo" | "tracking-in";

export type Beat = {
  /** TTS text (phonetic brand spelling inside) */
  say: string;
  /** on-screen words, spelled correctly; \n = explicit line break */
  show?: string;
  /** which element renders the beat */
  el: string;
  /** background colour token: blue | cream | coral | indigo | deep | yellow */
  bg: "blue" | "cream" | "coral" | "indigo" | "deep" | "yellow";
  mode?: Mode;
  /** transition INTO this beat */
  tr: string;
  /** word that lands on the cut (the beat starts at its onset) */
  land?: string;
  /** pause (s) after this beat in the TTS reading */
  gap?: number;
  /** how loud this beat's SFX hit is (0..1) */
  hit?: number;
  /** camera shake strength 0..1 */
  shake?: number;
};

export const SCRIPT: Beat[] = [
  // ---- HOOK -------------------------------------------------------------------------------
  { say: "No way.", show: "NO WAY.", el: "word", bg: "cream", mode: "slam", tr: "cut", hit: 1, shake: 0.5, gap: 0.18 },
  { say: "Homework?", show: "HOMEWORK?", el: "word-homework", bg: "blue", mode: "slam", tr: "flash-blue", hit: 1, shake: 0.6, gap: 0.14 },
  { say: "Dead.", show: "DEAD.", el: "word", bg: "coral", mode: "slam", tr: "cut", hit: 0.9, shake: 0.5, gap: 0.12 },
  { say: "Boring?", show: "BORING?", el: "word", bg: "indigo", mode: "slam", tr: "stripes", hit: 0.9, shake: 0.5, gap: 0.12 },
  { say: "Gone.", show: "GONE.", el: "word-gone", bg: "cream", mode: "stretch", tr: "cut", hit: 1, shake: 0.6, gap: 0.2 },
  { say: "Meet OO-chee-meh seh HROHW.", show: "MEET\nUČÍME SE HROU.", el: "extrude", bg: "blue", mode: "extrude", tr: "zoom", hit: 1, shake: 0.5, gap: 0.24 },

  // ---- THE BORING WAY ---------------------------------------------------------------------
  { say: "You know the drill.", show: "YOU KNOW\nTHE DRILL", el: "homework", bg: "cream", tr: "whip", hit: 0.6, gap: 0.16 },
  { say: "The boring way.", show: "THE BORING WAY", el: "boring", bg: "cream", tr: "cut", hit: 0.4, gap: 0.2 },
  { say: "Study.", show: "STUDY.", el: "stack", bg: "indigo", tr: "stripes", hit: 0.7, gap: 0.1 },
  { say: "Study!", show: "STUDY.", el: "stack", bg: "deep", tr: "glitch", hit: 0.9, shake: 0.4, gap: 0.1 },
  { say: "STUDY!!", show: "STUDY.", el: "stack-wall", bg: "indigo", tr: "cut", hit: 1, shake: 0.6, gap: 0.22 },
  { say: "Homework till midnight.", show: "HOMEWORK\nTILL MIDNIGHT", el: "timer", bg: "cream", tr: "record-stop", hit: 0.6, gap: 0.14 },
  { say: "Timers. Deadlines.", show: "TIMERS. DEADLINES.", el: "timerbig", bg: "indigo", tr: "whip", hit: 0.7, gap: 0.16 },
  { say: "Worksheets. Stacks of them.", show: "WORKSHEETS", el: "worksheets", bg: "cream", tr: "stripes", hit: 0.6, gap: 0.14 },
  { say: "Late night. No idea.", show: "LATE NIGHT.\nNO IDEA.", el: "word", bg: "indigo", mode: "tracking-in", tr: "whip", hit: 0.6, gap: 0.3 },
  { say: "Are you kidding me?", show: "ARE YOU\nKIDDING ME?", el: "kidding", bg: "coral", tr: "cut", hit: 1, shake: 0.7, gap: 0.34 },

  // ---- QUESTION MARK GAG + REVEAL ---------------------------------------------------------
  { say: "And then.", show: "AND THEN", el: "whisper", bg: "deep", tr: "laser", hit: 0.3, gap: 0.42 },
  { say: "Everything changes.", show: "EVERYTHING\nCHANGES", el: "word", bg: "blue", mode: "slam", tr: "cut", hit: 1, shake: 0.7, gap: 0.26 },
  { say: "Meet OO-chee-meh seh HROHW.", show: "", el: "logo", bg: "indigo", tr: "riser", hit: 1, gap: 0.3 },
  { say: "Learning that feels like a game.", show: "LEARNING THAT FEELS LIKE A GAME", el: "sub", bg: "indigo", tr: "cut", hit: 0.4, gap: 0.3 },

  // ---- YOU JUST PLAY ----------------------------------------------------------------------
  { say: "You just play.", show: "YOU JUST PLAY", el: "word", bg: "cream", mode: "stretch", tr: "shape", hit: 0.7, gap: 0.2 },
  { say: "Pick a course.", show: "PICK A COURSE", el: "player", bg: "indigo", tr: "whip", hit: 0.6, gap: 0.16 },
  { say: "Answer.", show: "ANSWER.", el: "quiz", bg: "cream", tr: "cut", hit: 0.8, gap: 0.12 },
  { say: "Get it right.", show: "GET IT RIGHT.", el: "quizright", bg: "cream", tr: "cut", hit: 0.8, gap: 0.14 },
  { say: "Wrong? You get the reason.", show: "WRONG?\nHERE'S WHY.", el: "explain", bg: "blue", tr: "glitch", hit: 0.5, gap: 0.22 },
  { say: "Points. Levels. Rewards.", show: "POINTS.\nLEVELS. REWARDS.", el: "points", bg: "coral", tr: "whip", hit: 0.9, gap: 0.24 },

  // ---- WHAT YOU GET (real features, one per beat) -----------------------------------------
  { say: "Farm.", show: "FARM", el: "screen-farm", bg: "blue", tr: "cut", hit: 0.8, gap: 0.14 },
  { say: "City.", show: "CITY", el: "screen-city", bg: "indigo", tr: "stripes", hit: 0.8, gap: 0.14 },
  { say: "Pets.", show: "PETS", el: "pets", bg: "cream", tr: "cut", hit: 0.8, gap: 0.14 },
  { say: "Escape rooms.", show: "ESCAPE ROOMS", el: "escape", bg: "coral", tr: "whip", hit: 0.9, gap: 0.16 },
  { say: "Daily quiz.", show: "DAILY QUIZ", el: "daily", bg: "blue", tr: "cut", hit: 0.8, gap: 0.14 },
  { say: "Review what's hard.", show: "REVIEW\nWHAT'S HARD", el: "review", bg: "cream", tr: "glitch", hit: 0.6, gap: 0.16 },
  { say: "Leaderboards.", show: "LEADERBOARDS", el: "boards", bg: "indigo", tr: "whip", hit: 0.8, gap: 0.16 },
  { say: "Shop. Frames. Rewards.", show: "SHOP.\nFRAMES. REWARDS.", el: "shop", bg: "coral", tr: "stripes", hit: 0.8, gap: 0.18 },
  { say: "Code lessons.", show: "CODE LESSONS", el: "code", bg: "indigo", tr: "cut", hit: 0.7, gap: 0.14 },
  { say: "Three-d town.", show: "3D TOWN", el: "town", bg: "blue", tr: "whip", hit: 0.9, gap: 0.14 },
  { say: "Your own room.", show: "YOUR OWN ROOM", el: "room", bg: "cream", tr: "cut", hit: 0.6, gap: 0.14 },
  { say: "Your own avatar.", show: "YOUR AVATAR", el: "avatars", bg: "indigo", tr: "stripes", hit: 0.7, gap: 0.14 },
  { say: "Teachers too.", show: "TEACHERS TOO", el: "teacher", bg: "coral", tr: "whip", hit: 0.8, gap: 0.14 },
  { say: "Eight languages.", show: "8 LANGUAGES", el: "langs", bg: "cream", tr: "glitch", hit: 0.7, gap: 0.18 },
  { say: "Five levels per course.", show: "5 LEVELS\nPER COURSE", el: "levels", bg: "indigo", tr: "stripes", hit: 0.7, gap: 0.24 },

  // ---- KINETIC CLOSER ---------------------------------------------------------------------
  { say: "Quizzes. Pets. Code. A whole town.", show: "QUIZZES.\nPETS.\nCODE.\nA WHOLE TOWN.", el: "montage", bg: "indigo", tr: "whip", hit: 0.9, gap: 0.2 },
  { say: "All yours.", show: "ALL YOURS.", el: "word", bg: "blue", mode: "slam", tr: "cut", hit: 1, shake: 0.6, gap: 0.18 },
  { say: "Free to start.", show: "FREE TO START.", el: "word", bg: "coral", mode: "tracking-in", tr: "flash-coral", hit: 0.8, gap: 0.22 },
  { say: "Play now.", show: "PLAY NOW.", el: "word", bg: "cream", mode: "slam", tr: "cut", hit: 1, shake: 0.7, gap: 0.3 },
  { say: "OO-chee-meh seh HROHW dot ORG.", show: "ucimesehrou.org", el: "cta", bg: "yellow", tr: "shape", hit: 1, gap: 0.2 },
  { say: "", show: "", el: "endcard", bg: "indigo", tr: "cut", hit: 0.4 },
];

/** End card length in seconds (no voice). */
export const ENDCARD_SEC = 3.8;
/** Target length of the spoken part; scripts/hype_voice.py stretches the gaps to hit it. */
export const VOICE_TARGET_SEC = 46;
