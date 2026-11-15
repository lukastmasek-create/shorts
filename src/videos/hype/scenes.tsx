// The scenes: one React component per element name in the shot list (script.ts `el`).
// Each receives `d` = frames since the beat landed, `dur` = the beat's length in frames, `f` =
// the global frame (micro-motion and parallax only) and `s` = the segment for words/colours.
import React from "react";
import { Img, staticFile } from "remotion";
import { ASSET, C, FONT, lip } from "./brand";
import { LogoReveal, TagPill, Wordmark } from "./Brand";
import {
  fitSize,
  layoutText,
  Blob,
  Card,
  Chip,
  Confetti,
  DotGrid,
  Extruded3DText,
  FilmStrip,
  HomeworkMock,
  KineticWord,
  NodeGraph,
  PhoneCard,
  PlayerMock,
  PromptBox,
  QuestionMarks,
  StackedList,
  Starburst,
  TimerGag,
  Viewfinder,
} from "./components";
import { clamp, ease, hash, jitter, lerp, pop, seg, shakeOf } from "./motion";
import type { Seg } from "./story";

export type SceneProps = { d: number; dur: number; f: number; s: Seg };

/** which ink reads on a background token */
export const fg = (bg: string) => (bg === "cream" || bg === "yellow" ? C.ink : C.cream);

const wordScene =
  (el: string) =>
  ({ d, dur, f, s }: SceneProps) => (
    <>
      {s.bg === "indigo" || s.bg === "deep" ? <DotGrid f={f} /> : null}
      <KineticWord text={s.text || el} d={d} dur={dur} mode={(s.mode as never) ?? "slam"} color={fg(s.bg)} bg={s.bg} size={sizeFor(s.text)} shake={s.shake * 8} />
    </>
  );

/** fit the type to the frame (same numbers as the type engine's layoutText/fitSize) */
export const sizeFor = (text: string) => fitSize(layoutText(text || "X"), 250);

/* ---------------------------------------------------------------- HOOK */
export const WordHomework: React.FC<SceneProps> = ({ d, dur, f, s }) => (
  <>
    <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={fg(s.bg)} bg={s.bg} size={sizeFor(s.text)} shake={7} />
    {/* the paper corner peeking in, then gone */}
    <div style={{ position: "absolute", right: -80, bottom: -60, width: 420, height: 300, background: C.surface, borderRadius: 24, transform: `rotate(-14deg) translateY(${(1 - pop(d, { damping: 13, stiffness: 200 })) * 300}px)`, boxShadow: lip(10, C.blueLip), opacity: 0.9 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 14, width: `${60 + i * 10}%`, background: C.border, borderRadius: 8, margin: "26px 30px" }} />
      ))}
    </div>
  </>
);

export const WordGone: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <KineticWord text={s.text} d={d} dur={dur} mode="stretch" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={6} />
    {/* the word physically leaves: it stretches then snaps into a tile that flies off */}
    <div
      style={{
        position: "absolute",
        left: `${50 + seg(d, 10, 20) * 40}%`,
        top: "50%",
        width: 90,
        height: 90,
        borderRadius: 28,
        background: C.coral,
        boxShadow: lip(8, C.coralLip),
        opacity: seg(d, 12, 18),
        transform: `scale(${pop(d - 12, { damping: 11, stiffness: 220 })}) rotate(${d * 6}deg)`,
      }}
    />
  </>
);

export const WordExtrude: React.FC<SceneProps> = ({ d, dur, s }) => (
  <Extruded3DText text={s.text} d={d} dur={dur} color={C.cream} size={sizeFor(s.text.split("\n")[1] ?? s.text)} />
);

/* ---------------------------------------------------------------- THE BORING WAY */
export const HomeworkScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <div style={{ position: "absolute", left: 70, top: 250, right: 70 }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 34, letterSpacing: "0.24em", color: C.muted, opacity: seg(d, 0, 8), marginBottom: 24 }}>MONDAY · 19:40</div>
      <HomeworkMock d={d - 4} crossed={false} label="WORKSHEET" />
    </div>
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 220 }}>
      <KineticWord text={s.text} d={d - 2} dur={30} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} align="left" crop />
    </div>
    {f > 0 ? null : null}
  </>
);

export const BoringScene: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <HomeworkMock d={d + 30} crossed label="WORKSHEET 12" />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {seg(d, 8, 14) > 0 ? (
        <div style={{ position: "relative", transform: `rotate(-4deg) scale(${pop(d - 8, { damping: 12, stiffness: 210 })})` }}>
          <div style={{ fontFamily: FONT.hand, fontSize: 96, color: C.ink, opacity: 0.92 }}>the boring way</div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, height: 7, background: C.coral, borderRadius: 9, transform: `scaleX(${seg(d, 12, 20)})`, transformOrigin: "left" }} />
        </div>
      ) : null}
      <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: "0.3em", color: C.muted, opacity: seg(d, 18, 24) }}>EVERY. SINGLE. DAY.</div>
    </div>
    <div style={{ position: "absolute", left: 120, top: 330, transform: `rotate(-8deg)`, opacity: seg(d, 4, 10) * 0.9 }}>
      <Chip bg={C.coral} size={26}>DUE TOMORROW</Chip>
    </div>
    {dur ? null : null}
  </>
);

export const StackScene: React.FC<SceneProps> = ({ d, f, s }) => <StackedList d={d} word={s.text || "STUDY."} wall={false} f={f} />;

export const StackWallScene: React.FC<SceneProps> = ({ d, f }) => <StackedList d={d} word="STUDY." wall f={f} />;

export const TimerScene: React.FC<SceneProps> = ({ d, dur, f, s }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 760 }}>
      <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={4} crop />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 380 }}>
      <TimerGag d={d - 4} f={f + 300} />
    </div>
  </>
);

export const TimerBigScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <DotGrid f={f} color={C.coral} alpha={0.2} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 700 }}>
      <KineticWord text={s.text} d={d} dur={40} mode="tracking-in" color={C.cream} bg={s.bg} size={sizeFor(s.text)} crop />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 300 }}>
      <TimerGag d={d - 6} f={f} eta="" ink={C.cream} />
    </div>
  </>
);

export const WorksheetsScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const p = pop(d - i * 3, { damping: 13, stiffness: 220 });
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 70 + i * 52,
            top: 420 + i * 105 - (1 - p) * 120,
            width: 660,
            height: 430,
            background: C.surface,
            border: `4px solid ${C.border}`,
            borderRadius: 22,
            transform: `rotate(${(i - 1.5) * 3}deg)`,
            boxShadow: lip(10, C.border),
            padding: 26,
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.muted, letterSpacing: "0.16em" }}>SHEET {i + 1} / 4</div>
          {[0, 1, 2, 3, 4].map((r) => (
            <div key={r} style={{ height: 12, width: `${40 + hash(r + i, 2) * 55}%`, background: r % 2 ? "#eceadf" : C.border, borderRadius: 6, margin: "16px 0" }} />
          ))}
        </div>
      );
    })}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, height: 420 }}>
      <KineticWord text={s.text} d={d - 2} dur={30} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={3} crop />
    </div>
    <Confetti f={f} count={18} burstAt={0} drift={0.4} />
  </>
);

export const KiddingScene: React.FC<SceneProps> = ({ d, dur, f, s }) => (
  <>
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Starburst d={d} size={1500} points={12} color={C.coral} spin={4} />
    </div>
    <QuestionMarks d={d} count={4} seed={2} />
    <KineticWord text={s.text} d={d - 2} dur={dur} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={9} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, display: "flex", justifyContent: "center", gap: 16, opacity: seg(d, 10, 16) }}>
      {["?", "??", "???"].map((q, i) => (
        <div key={q} style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 90, color: C.ink, transform: `rotate(${(hash(i, 3) - 0.5) * 20}deg)` }}>
          {q}
        </div>
      ))}
    </div>
    {f ? null : null}
  </>
);

/* ---------------------------------------------------------------- REVEAL */
export const WhisperScene: React.FC<SceneProps> = ({ d, s }) => {
  const a = seg(d, 6, 12);
  return (
    <>
      <DotGrid f={0} color={C.glow} alpha={0.14} />
      <KineticWord text={s.text} d={d - 2} dur={40} mode="tracking-in" color={C.cream} bg={s.bg} size={sizeFor(s.text)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: "0.42em", color: C.glow, opacity: a }}>
        HOLD ON
      </div>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 24, height: 24, marginLeft: -12, marginTop: -12, borderRadius: 8, background: C.coral, boxShadow: `0 0 ${40 + Math.sin(d * 0.3) * 20}px ${C.coral}`, opacity: clamp(seg(d, 0, 6)) }} />
    </>
  );
};

export const EverythingScene: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <Confetti f={d} count={60} burstAt={0} drift={0.5} />
    <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={C.cream} bg={s.bg} size={sizeFor(s.text)} shake={11} />
  </>
);

export const LogoScene: React.FC<SceneProps> = ({ d, dur, f }) => {
  const glow = 0.55 + 0.25 * Math.sin(d * 0.12);
  const drop = d - 4;
  return (
    <>
      <DotGrid f={f} color={C.glow} alpha={0.12} />
      <div style={{ position: "absolute", left: "50%", top: 380, transform: "translateX(-50%)", width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, rgba(90,108,255,${glow * 0.5}), rgba(18,16,42,0) 70%)` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, paddingBottom: 120 }}>
        <LogoReveal d={drop} scale={1.35} />
        <Wordmark d={drop - 6} size={74} colour={C.cream} />
        <div style={{ opacity: seg(drop, 22, 30), transform: `translateY(${(1 - seg(drop, 22, 30)) * 14}px)` }}>
          <TagPill d={drop - 22} size={40} />
        </div>
      </div>
      <Confetti f={d} count={16} burstAt={2} drift={0.22} />
      {dur ? null : null}
    </>
  );
};

export const SubScene: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", opacity: 0.9 }}>
      <LogoReveal d={40} scale={0.62} />
    </div>
    <div style={{ position: "absolute", left: 90, right: 90, top: 1010 }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 76, lineHeight: 1.18, color: C.cream, textAlign: "center" }}>
        {s.text
          .toLowerCase()
          .split(" ")
          .map((w, i) => (
            <span key={i} style={{ display: "inline-block", opacity: clamp(seg(d - 2 - i * 3, 0, 6)), transform: `translateY(${(1 - pop(d - 2 - i * 3, { damping: 13, stiffness: 210 })) * 22}px)`, marginRight: 12 }}>
              {w === "game." ? <span style={{ color: C.yellow }}>{w}</span> : w}
            </span>
          ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40, opacity: seg(d, 16, 24) }}>
        <TagPill d={d - 16} text="ucimesehrou.org" size={40} />
      </div>
    </div>
    {dur ? null : null}
  </>
);

/* ---------------------------------------------------------------- YOU JUST PLAY */
export const YouJustPlay: React.FC<SceneProps> = ({ d, dur, f, s }) => (
  <>
    <Blob d={d} size={1200} color={C.yellow} morph={0.06} />
    <KineticWord text={s.text} d={d} dur={dur} mode="stretch" color={C.ink} bg={s.bg} size={sizeFor(s.text)} />
    <Confetti f={f} count={22} burstAt={0} drift={0.3} />
  </>
);

export const PlayerScene: React.FC<SceneProps> = ({ d, f }) => (
  <>
    <DotGrid f={f} alpha={0.1} />
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, paddingBottom: 120 }}>
      <PlayerMock d={d} f={f} shot={ASSET.screens.mazlicci} />
      <div style={{ display: "flex", gap: 18 }}>
        {["FRACTIONS", "5 LEVELS", "+50 POINTS"].map((t, i) => (
          <div key={t} style={{ opacity: seg(d - 10 - i * 3, 0, 8), transform: `scale(${pop(d - 10 - i * 3, { damping: 12, stiffness: 220 })})` }}>
            <Chip bg={[C.yellow, C.cream, C.green][i]} size={28}>{t}</Chip>
          </div>
        ))}
      </div>
    </div>
    <FilmStrip f={f} opacity={0.55} />
  </>
);

export const QuizScene: React.FC<SceneProps> = ({ d, s }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
      <KineticWord text={s.text} d={d} dur={26} mode="slam" color={C.ink} bg={s.bg} size={Math.min(132, sizeFor(s.text))} />
    </div>
    <div style={{ position: "absolute", left: 90, right: 90, top: 800 }}>
      <PhoneCard d={d - 4} w={900}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: C.muted, letterSpacing: "0.18em" }}>MATHS · FRACTIONS · LEVEL 3</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 54, color: C.ink, margin: "24px 0 30px", lineHeight: 1.2 }}>
          7 × 8 = <span style={{ color: C.coral }}>?</span>
        </div>
        {["54", "56", "58"].map((a, i) => {
          const chosen = i === 1 && d > 14;
          const wrongPick = i === 0 && d > 10 && d < 14;
          return (
            <div
              key={a}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: chosen ? C.green : wrongPick ? C.coral : C.surface,
                color: chosen || wrongPick ? C.cream : C.ink,
                border: `4px solid ${chosen ? C.greenLip : wrongPick ? C.coralLip : C.border}`,
                borderRadius: 22,
                padding: "22px 28px",
                marginBottom: 16,
                fontFamily: FONT.body,
                fontWeight: 800,
                fontSize: 40,
                transform: `translateX(${chosen ? 10 : 0}px) scale(${chosen ? 1.03 : 1})`,
              }}
            >
              <span>{a}</span>
              <span>{chosen ? "✓" : wrongPick ? "✕" : ""}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.ink }}>7 × 8 = 56</div>
          <div style={{ marginLeft: "auto", fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, color: C.green }}>+50</div>
        </div>
      </PhoneCard>
    </div>
  </>
);

export const QuizRightScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <DotGrid f={f} color={C.green} alpha={0.14} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${pop(d, { damping: 10, stiffness: 240 })}) rotate(${Math.sin(d * 0.2) * 4}deg)` }}>
        <div style={{ width: 340, height: 340, borderRadius: 90, background: C.green, boxShadow: lip(18, C.greenLip), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={200} height={200} viewBox="0 0 24 24"><path d="M4 12.5l5.2 5.2L20 7" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1050, display: "flex", justifyContent: "center" }}>
      <KineticWord text={s.text} d={d - 3} dur={24} mode="slam" color={C.ink} bg={s.bg} size={Math.min(120, sizeFor(s.text))} />
    </div>
    <Confetti f={f} count={40} burstAt={0} drift={0.4} />
  </>
);

export const ExplainScene: React.FC<SceneProps> = ({ d, s }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", justifyContent: "center" }}>
      {s.text ? <KineticWord text={s.text} d={d} dur={36} mode="scramble" color={C.cream} bg={s.bg} size={Math.min(112, sizeFor(s.text))} /> : null}
    </div>
    <div style={{ position: "absolute", left: 90, right: 90, top: 780 }}>
      <Card bg={C.darkSurface} pad={40} style={{ border: `3px solid ${C.darkBorder}`, boxShadow: lip(12, "#07061a") }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Chip bg={C.coral} fg={C.ink} size={24}>WHY?</Chip>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: C.cream, opacity: 0.75 }}>every answer has one</div>
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.cream, lineHeight: 1.35, marginTop: 22 }}>
          8 × 7 = 56. Count by sevens: <span style={{ color: C.yellow }}>7, 14, 21, 28, 35, 42, 49, 56</span>. Eight jumps of seven.
        </div>
        <div style={{ marginTop: 24, height: 10, borderRadius: 99, background: C.darkBorder }}>
          <div style={{ height: "100%", width: `${clamp(seg(d, 6, 26)) * 100}%`, background: C.yellow, borderRadius: 99 }} />
        </div>
      </Card>
    </div>
  </>
);

export const PointsScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <DotGrid f={f} color={C.ink} alpha={0.12} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center", gap: 26 }}>
      {[ASSET.rewards.coin, ASSET.rewards.badge, ASSET.rewards.trophy].map((src, i) => {
        const p = pop(d - i * 4, { damping: 11, stiffness: 220 });
        return (
          <div key={src} style={{ transform: `scale(${p}) translateY(${Math.sin((f + i * 12) * 0.06) * 10}px)` }}>
            <Img src={staticFile(src)} style={{ width: i === 2 ? 300 : 240 }} />
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
      <KineticWord text={s.text} d={d} dur={44} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={5} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 260, display: "flex", justifyContent: "center", gap: 20 }}>
      <Chip bg={C.ink} fg={C.cream} size={44}>+50 PTS</Chip>
      <Chip bg={C.yellow} size={44}>LEVEL UP</Chip>
    </div>
  </>
);

/* ---------------------------------------------------------------- CAPABILITY MONTAGE */
const ScreenBeat =
  (shot: keyof typeof ASSET.screens) =>
  ({ d, dur, f, s }: SceneProps) => {
    const p = pop(d, { damping: 13, stiffness: 190 });
    return (
      <>
        <div style={{ position: "absolute", left: "50%", top: 780, transform: "translateX(-50%)", width: 900, height: 620, marginTop: -260 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 40,
              overflow: "hidden",
              transform: `scale(${lerp(1.12, 1, p)}) rotate(${lerp(-3, 0, p)}deg)`,
              boxShadow: lip(16, C.ink),
              border: `6px solid ${fg(s.bg)}`,
            }}
          >
            <Img src={staticFile(ASSET.screens[shot])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 380 }}>
          <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={fg(s.bg)} bg={s.bg} size={sizeFor(s.text)} shake={6} />
        </div>
        <Viewfinder d={d - 6} label="LIVE" sub={`LEVEL 0${1 + (f % 5)}`} f={f} color={f % 2 ? C.yellow : C.cream} />
      </>
    );
  };

export const ScreenFarm = ScreenBeat("farma");
export const ScreenCity = ScreenBeat("mesto");

export const PetsScene: React.FC<SceneProps> = ({ d, dur, f, s }) => {
  const pets = [ASSET.pets.cat, ASSET.pets.dog, ASSET.pets.fox, ASSET.pets.panda, ASSET.pets.dragon, ASSET.pets.bunny];
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, padding: "0 60px" }}>
        {pets.map((p, i) => {
          const pp = pop(d - i * 2.2, { damping: 12, stiffness: 220 });
          return (
            <div key={p} style={{ width: 280, transform: `scale(${pp}) rotate(${(hash(i, 2) - 0.5) * 10}deg)` }}>
              <div style={{ background: C.surface, borderRadius: 34, border: `5px solid ${C.border}`, boxShadow: lip(9, C.border), padding: 14 }}>
                <Img src={staticFile(p)} style={{ width: "100%" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 260 }}>
        <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={5} />
      </div>
      <Confetti f={f} count={20} burstAt={0} drift={0.3} />
    </>
  );
};

export const EscapeScene: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <div style={{ position: "absolute", inset: 0 }}>
      {[ASSET.escapes.kitchen, ASSET.escapes.lab, ASSET.escapes.castle].map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute",
            left: 60 + i * 90,
            top: 360 + i * 140,
            width: 720 - i * 90,
            height: 560 - i * 60,
            borderRadius: 34,
            overflow: "hidden",
            transform: `rotate(${(i - 1) * 7}deg)`,
            boxShadow: lip(14, C.ink),
            border: `6px solid ${C.ink}`,
            opacity: 1 - i * 0.18,
          }}
        >
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1290, height: 300 }}>
      <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={C.ink} bg={s.bg} size={Math.min(150, sizeFor(s.text))} shake={5} crop />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 250, display: "flex", justifyContent: "center", gap: 16 }}>
      <Chip bg={C.ink} fg={C.cream} size={34}>ESCAPE THE LAB</Chip>
      <Chip bg={C.yellow} size={34}>BEFORE TIME RUNS OUT</Chip>
    </div>
  </>
);

export const DailyScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <DotGrid f={f} alpha={0.14} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
      <PhoneCard d={d} w={820}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip bg={C.coral} size={24}>DAILY CHALLENGE</Chip>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 28, color: C.muted }}>ENDS IN 09:41</div>
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 58, color: C.ink, margin: "26px 0 10px", lineHeight: 1.15 }}>New questions. Every day.</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: C.muted }}>Correct answers earn bonus points.</div>
        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ flex: 1, height: 14, borderRadius: 99, background: i < 4 + (f % 3) ? C.green : C.border }} />
          ))}
        </div>
      </PhoneCard>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 300 }}>
      <KineticWord text={s.text} d={d - 3} dur={30} mode="slam" color={C.cream} bg={s.bg} size={sizeFor(s.text)} shake={4} />
    </div>
  </>
);

export const ReviewScene: React.FC<SceneProps> = ({ d, s }) => (
  <>
    <div style={{ position: "absolute", left: 80, right: 80, top: 520 }}>
      <Card pad={44}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: "0.18em", color: C.muted }}>REVIEW · WHAT IS HARD</div>
        {[
          ["Fractions", 72, C.coral],
          ["Word problems", 48, C.yellow],
          ["Percentages", 26, C.blue],
        ].map(([label, v, col], i) => (
          <div key={String(label)} style={{ marginTop: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.ink }}>
              <span>{label}</span>
              <span>{Math.round(Number(v) * ease.out(seg(d - i * 4, 0, 18)))}%</span>
            </div>
            <div style={{ height: 22, borderRadius: 99, background: C.border, marginTop: 12 }}>
              <div style={{ height: "100%", borderRadius: 99, background: String(col), width: `${Number(v) * ease.out(seg(d - i * 4, 0, 18))}%` }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 380 }}>
      <KineticWord text={s.text} d={d - 2} dur={30} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={4} />
    </div>
  </>
);

export const BoardsScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <DotGrid f={f} color={C.yellow} alpha={0.12} />
    <div style={{ position: "absolute", left: 100, right: 100, top: 560 }}>
      {["5.B · YOUR CLASS", "YOUR SCHOOL", "THE WHOLE COUNTRY"].map((row, i) => {
        const p = pop(d - i * 4, { damping: 13, stiffness: 210 });
        return (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              background: i === 1 ? C.yellow : C.darkSurface,
              color: i === 1 ? C.ink : C.cream,
              border: `3px solid ${i === 1 ? C.yellowLip : C.darkBorder}`,
              borderRadius: 26,
              padding: "24px 30px",
              marginBottom: 20,
              transform: `translateX(${(1 - p) * 60}px)`,
              opacity: clamp(p * 2),
              boxShadow: lip(8, "#07061a"),
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 54, opacity: 0.7 }}>{i + 1}</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 34, flex: 1 }}>{row}</div>
            <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 30 }}>{["2,480", "1,920", "980"][i]} XP</div>
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 380 }}>
      <KineticWord text={s.text} d={d} dur={34} mode="slam" color={C.cream} bg={s.bg} size={sizeFor(s.text)} shake={4} />
    </div>
  </>
);

export const ShopScene: React.FC<SceneProps> = ({ d, s }) => (
  <>
    <div style={{ position: "absolute", left: 70, right: 70, top: 540, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
      {[
        { icon: "shop/frame.svg", name: "FRAMES", price: "250", bg: C.cream },
        { icon: "shop/limited.svg", name: "LIMITED", price: "500", bg: C.ink },
        { icon: "shop/pet.svg", name: "PETS", price: "120", bg: C.blue },
        { icon: "shop/city.svg", name: "CITY", price: "300", bg: C.yellow },
      ].map((it, i) => {
        const p = pop(d - i * 3, { damping: 12, stiffness: 220 });
        return (
          <div
            key={it.name}
            style={{
              width: 400,
              background: C.surface,
              borderRadius: 30,
              border: `5px solid ${C.border}`,
              boxShadow: lip(10, C.border),
              padding: 20,
              transform: `scale(${p}) rotate(${(hash(i, 4) - 0.5) * 4}deg)`,
            }}
          >
            <div style={{ background: it.bg as string, borderRadius: 22, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Img src={staticFile(`hype/${it.icon}`)} style={{ width: 170 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.ink }}>
              <span>{it.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Img src={staticFile(ASSET.rewards.coin)} style={{ width: 34 }} />
                {it.price}
              </span>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 320 }}>
      <KineticWord text={s.text} d={d} dur={38} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={5} />
    </div>
  </>
);

export const CodeScene: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <DotGrid f={0} color={C.sky} alpha={0.1} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
      <KineticWord text={s.text} d={d} dur={dur} mode="outline-echo" color={C.cream} bg={s.bg} size={sizeFor(s.text)} />
    </div>
    <div style={{ position: "absolute", left: 70, right: 70, top: 700 }}>
      <Card bg="#0f0d24" pad={34} style={{ border: `3px solid ${C.darkBorder}`, boxShadow: lip(12, "#07061a") }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {["index.html", "style.css", "script.js"].map((t, i) => (
            <div key={t} style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, color: i === 0 ? C.ink : C.cream, background: i === 0 ? C.yellow : C.darkSurface, padding: "8px 16px", borderRadius: 12, opacity: i === 0 ? 1 : 0.7 }}>
              {t}
            </div>
          ))}
        </div>
        {[
          ["<h1>", C.coral],
          ["  Učíme se hrou", C.cream],
          ["</h1>", C.coral],
        ].map(([line, col], i) => {
          const on = d > 8 + i * 5;
          return (
            <div key={i} style={{ position: "relative", fontFamily: FONT.mono, fontWeight: 500, fontSize: 40, color: String(col), lineHeight: 1.5, background: on ? "rgba(255,90,60,.14)" : "transparent", borderRadius: 10 }}>
              {line}
              {on ? <span style={{ position: "absolute", right: 8, top: 8, background: C.coral, color: C.ink, fontSize: 20, fontWeight: 700, padding: "3px 9px", borderRadius: 7 }}>WHY?</span> : null}
            </div>
          );
        })}
        <div style={{ marginTop: 22, display: "flex", gap: 14, alignItems: "center", opacity: seg(d, 16, 22) }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 24, color: C.cream, opacity: 0.7 }}>one line at a time</div>
          <div style={{ marginLeft: "auto", width: 66, height: 34, borderRadius: 99, background: C.green, position: "relative" }}>
            <div style={{ position: "absolute", right: 4, top: 4, width: 26, height: 26, borderRadius: 99, background: "#fff" }} />
          </div>
        </div>
      </Card>
    </div>
  </>
);

export const TownScene: React.FC<SceneProps> = ({ d, f, s }) => {
  // the screenshot is square; at a third-width it only needs ~320 px, so the word can sit below it
  // instead of under the inset farm picture
  const w = 1000;
  return (
    <>
      <div style={{ position: "absolute", left: (1080 - w) / 2, top: 430, width: w }}>
        <div style={{ transform: `scale(${lerp(1.1, 1, pop(d, { damping: 13, stiffness: 190 }))}) rotate(${lerp(2, -1.2, d / 40)}deg)`, borderRadius: 44, overflow: "hidden", border: `8px solid ${C.ink}`, boxShadow: lip(16, C.ink) }}>
          <Img src={staticFile(ASSET.screens.mesto)} style={{ width: "100%", display: "block" }} />
        </div>
        <div style={{ position: "absolute", right: -30, bottom: -70, width: 250, transform: `translateY(${Math.sin(f * 0.09) * 8}px) rotate(-6deg)` }}>
          <div style={{ background: C.yellow, borderRadius: 30, border: `5px solid ${C.ink}`, padding: 12, boxShadow: lip(9, C.ink) }}>
            <Img src={staticFile(ASSET.screens.farma)} style={{ width: "100%", borderRadius: 20 }} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 330 }}>
        <KineticWord text={s.text} d={d - 2} dur={30} mode="slam" color={C.cream} bg={s.bg} size={Math.min(190, sizeFor(s.text))} shake={6} />
      </div>
    </>
  );
};

export const RoomScene: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <div style={{ position: "absolute", left: 60, right: 60, top: 520, borderRadius: 40, overflow: "hidden", border: `8px solid ${C.ink}`, boxShadow: lip(16, C.ink) }}>
      <Img src={staticFile("hype/room.webp")} style={{ width: "100%" }} />
      {[
        { x: 20, y: 30, src: "shop/pets.svg" },
        { x: 62, y: 22, src: "shop/city.svg" },
        { x: 42, y: 58, src: "shop/frame.svg" },
      ].map((it, i) => (
        <div key={i} style={{ position: "absolute", left: `${it.x}%`, top: `${it.y}%`, width: 110, transform: `scale(${pop(d - 8 - i * 4, { damping: 12, stiffness: 220 })}) translateY(${Math.sin(f * 0.07 + i) * 6}px)`, background: C.surface, borderRadius: 24, padding: 10, boxShadow: lip(7, C.border) }}>
          <Img src={staticFile(`hype/${it.src}`)} style={{ width: "100%" }} />
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 380 }}>
      <KineticWord text={s.text} d={d - 2} dur={30} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={4} />
    </div>
  </>
);

export const AvatarsScene: React.FC<SceneProps> = ({ d, dur, s }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", gap: 24 }}>
      {[ASSET.avatars?.astronaut ?? "hype/avatars/astronaut.webp", "hype/avatars/wizard.webp", "hype/avatars/ninja.webp"].map((src, i) => (
        <div key={src} style={{ width: 280, transform: `scale(${pop(d - i * 3, { damping: 11, stiffness: 230 })}) translateY(${Math.sin((d + i * 9) * 0.12) * 12}px)` }}>
          <div style={{ background: [C.blue, C.coral, C.yellow][i], borderRadius: 40, border: `6px solid ${C.ink}`, boxShadow: lip(10, C.ink), padding: 12 }}>
            <Img src={staticFile(src)} style={{ width: "100%", borderRadius: 28 }} />
          </div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 360 }}>
      <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={C.cream} bg={s.bg} size={sizeFor(s.text)} shake={5} />
    </div>
  </>
);

export const TeacherScene: React.FC<SceneProps> = ({ d, s }) => (
  <>
    <div style={{ position: "absolute", left: 80, right: 80, top: 560 }}>
      <Card pad={44}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Chip bg={C.green} fg={C.cream} size={26}>TEACHER</Chip>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: C.muted }}>class 5.B · free for teachers</div>
        </div>
        {[
          ["Create a class", "code: 5B-KVET"],
          ["Assign practice", "fractions · 12 min"],
          ["See results", "18 pupils done"],
        ].map(([a, b], i) => (
          <div key={a} style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 0", borderBottom: i < 2 ? `3px solid ${C.border}` : "none" }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: [C.blue, C.yellow, C.green][i], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: i === 1 ? C.ink : C.cream }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.ink }}>{a}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.muted }}>{b}</div>
          </div>
        ))}
      </Card>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 340 }}>
      <KineticWord text={s.text} d={d} dur={32} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={5} />
    </div>
  </>
);

export const LangsScene: React.FC<SceneProps> = ({ d, dur, s }) => {
  const langs = ["CS", "EN", "DE", "RU", "UK", "JA", "ES", "FR"];
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, padding: "0 120px" }}>
        {langs.map((l, i) => (
          <div
            key={l}
            style={{
              width: 190,
              height: 190,
              borderRadius: 52,
              background: [C.blue, C.coral, C.yellow, C.green][i % 4],
              boxShadow: lip(10, C.ink),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 72,
              color: i % 4 === 2 ? C.ink : C.cream,
              transform: `scale(${pop(d - i * 2, { damping: 11, stiffness: 230 })}) rotate(${(hash(i, 6) - 0.5) * 12}deg)`,
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 400 }}>
        <KineticWord text={s.text} d={d} dur={dur} mode="slam" color={C.ink} bg={s.bg} size={sizeFor(s.text)} shake={4} />
      </div>
    </>
  );
};

export const LevelsScene: React.FC<SceneProps> = ({ d, s }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      {[1, 2, 3, 4, 5].map((n, i) => {
        const p = pop(d - i * 4, { damping: 12, stiffness: 220 });
        return (
          <div
            key={n}
            style={{
              width: 620 - i * 20,
              height: 110,
              borderRadius: 26,
              background: i < 4 ? C.cream : C.yellow,
              boxShadow: lip(8, "#07061a"),
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 26px",
              transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px)`,
              opacity: clamp(p * 1.6),
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: C.ink }}>{n}</div>
            <div style={{ height: 18, flex: 1, borderRadius: 99, background: "#d9d5c6" }}>
              <div style={{ height: "100%", width: `${(5 - i) * 18}%`, borderRadius: 99, background: [C.blue, C.coral, C.yellow, C.green, C.violet][i] }} />
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
      <KineticWord text={s.text} d={d} dur={38} mode="slam" color={C.cream} bg={s.bg} size={sizeFor(s.text)} />
    </div>
  </>
);

/* ---------------------------------------------------------------- CLOSER */
export const MontageSceneReal: React.FC<SceneProps> = ({ d, f, s }) => (
  <>
    <Confetti f={f} count={40} burstAt={0} drift={0.45} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 240, bottom: 240, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
      {s.text.split("\n").map((ln, i) => {
        const at = (s.words[i]?.f ?? i * 8);
        return (
          <div key={i} style={{ transform: `translateX(${(1 - pop(d - at, { damping: 12, stiffness: 240 })) * -260}px)`, opacity: clamp(seg(d - at, 0, 4)) }}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 118,
                color: [C.cream, C.yellow, C.coral, C.green][i % 4],
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                textTransform: "uppercase",
                paddingLeft: 60,
              }}
            >
              {ln}
            </div>
          </div>
        );
      })}
    </div>
  </>
);

export const CtaScene: React.FC<SceneProps> = ({ d, dur, f, s }) => {
  const p = pop(d, { damping: 12, stiffness: 200 });
  return (
    <>
      <DotGrid f={f} color={C.ink} alpha={0.1} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 900,
            background: C.surface,
            borderRadius: 52,
            border: `7px solid ${C.ink}`,
            boxShadow: lip(18, C.ink),
            padding: "54px 46px 46px",
            transform: `scale(${p}) rotate(${lerp(-4, -1, p)}deg)`,
            textAlign: "center",
          }}
        >
          <LogoReveal d={40} scale={0.7} onLight />
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.ink, marginTop: 26, letterSpacing: "-0.02em" }}>PLAY FREE AT</div>
          <div style={{ marginTop: 14, background: C.yellow, border: `6px solid ${C.ink}`, borderRadius: 26, padding: "22px 18px", boxShadow: lip(9, C.ink) }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 66, color: C.ink, letterSpacing: "-0.01em" }}>ucimesehrou.org</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 26 }}>
            {["QUIZZES", "PETS", "CODE", "3D TOWN"].map((t) => (
              <Chip key={t} bg={C.cream} fg={C.muted} size={24}>{t}</Chip>
            ))}
          </div>
        </div>
      </div>
      <Confetti f={f} count={36} burstAt={4} drift={0.3} />
      {dur ? null : null}
    </>
  );
};

export const EndScene: React.FC<SceneProps> = ({ d, f }) => (
  <>
    <DotGrid f={f} color={C.glow} alpha={0.1} />
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, paddingBottom: 80 }}>
      <LogoReveal d={d - 2} scale={1.15} />
      <Wordmark d={d - 12} size={78} colour={C.cream} />
      <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 46, letterSpacing: "0.02em", color: C.cream, opacity: seg(d, 18, 26), background: C.blue, padding: "16px 34px", borderRadius: 999, boxShadow: lip(8, C.blueLip) }}>
        ucimesehrou.org
      </div>
      <div style={{ fontFamily: FONT.hand, fontSize: 44, color: C.yellow, opacity: seg(d, 26, 34), transform: `rotate(-3deg)` }}>learning that feels like a game</div>
    </div>
    <Confetti f={d} count={30} burstAt={2} drift={0.2} />
  </>
);

/** a prompt box beat (used by the code lesson and the "ask anything" gag) */
export const PromptBoxScene: React.FC<SceneProps> = ({ d, dur }) => (
  <div style={{ position: "absolute", inset: 0, paddingTop: 620 }}>
    <PromptBox d={d} dur={dur} text="Explain fractions like I'm 10" chips={["pizza", "1/2", "simpler"]} accent={C.coral} />
  </div>
);

/** the node graph beat (quiz -> points -> pet -> shop) */
export const NodesScene: React.FC<SceneProps> = ({ d, f }) => (
  <>
    <DotGrid f={f} color={C.glow} alpha={0.1} />
    <NodeGraph d={d} f={f} accent={C.sky} labels={[["answer right", ""], ["+50 points", ""], ["feed it", ""]]} />
  </>
);

/** element registry: script.ts `el` -> component */
export const SCENES: Record<string, React.FC<SceneProps>> = {
  word: wordScene("word"),
  "word-homework": WordHomework,
  "word-gone": WordGone,
  homework: HomeworkScene,
  boring: BoringScene,
  stack: StackScene,
  "stack-wall": StackWallScene,
  timer: TimerScene,
  timerbig: TimerBigScene,
  worksheets: WorksheetsScene,
  kidding: KiddingScene,
  whisper: WhisperScene,
  logo: LogoScene,
  sub: SubScene,
  player: PlayerScene,
  quiz: QuizScene,
  quizright: QuizRightScene,
  explain: ExplainScene,
  points: PointsScene,
  "screen-farm": ScreenFarm,
  "screen-city": ScreenCity,
  pets: PetsScene,
  escape: EscapeScene,
  daily: DailyScene,
  review: ReviewScene,
  boards: BoardsScene,
  shop: ShopScene,
  code: CodeScene,
  town: TownScene,
  room: RoomScene,
  avatars: AvatarsScene,
  teacher: TeacherScene,
  langs: LangsScene,
  levels: LevelsScene,
  montage: MontageSceneReal,
  cta: CtaScene,
  endcard: EndScene,
  // word beats with an explicit extrusion beat (the reveal and the "MEET" line)
  extrude: WordExtrude,
  prompt: PromptBoxScene,
  nodes: NodesScene,
  nodegraph: NodesScene,
};


