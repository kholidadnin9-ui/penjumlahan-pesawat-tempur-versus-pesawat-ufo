import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ship from './Ship';
import Ufo from './Ufo';
import Meteor from './Meteor';
import Explosion from './Explosion';
import { generateQuestions, Question } from '../game/questions';
import { NOSE_X, NOSE_Y, PALETTES, ShipColor, SHIP_VB_H, SHIP_VB_W } from '../game/ships';
import { UFO_NOSE_X, UFO_NOSE_Y, UFO_VB_H, UFO_VB_W } from '../game/ufo';
import { sfxBoom, sfxLaser, sfxTick, sfxTimeout, sfxWrong } from '../game/sound';

export type Actor = 'player' | 'rival';
export type RivalKind = { type: 'ufo' } | { type: 'player'; color: ShipColor; name: string; keys: string[] };

type Props = {
  level: number;
  playerName: string;
  playerColor: ShipColor;
  playerKeys: string[];
  rival: RivalKind;
  timeLimit: number;
  onFinish: (playerScore: number, rivalScore: number, timeMs: number) => void;
};

const MPOS = [
  { x: 0.4, y: 0.22 },
  { x: 0.46, y: 0.52 },
  { x: 0.4, y: 0.82 },
];

type Shot = { id: number; actor: Actor; idx: number; correct: boolean };
type Phase = 'aim' | 'resolved' | 'done';

const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const norm180 = (deg: number) => { while (deg > 180) deg -= 360; while (deg < -180) deg += 360; return deg; };

export default function Battlefield({ level, playerName, playerColor, playerKeys, rival, timeLimit, onFinish }: Props) {
  const questions = useMemo(() => generateQuestions(level, 10), [level]);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>('aim');
  const [scores, setScores] = useState({ player: 0, rival: 0 });
  const [shots, setShots] = useState<Shot[]>([]);
  const [wrongFlash, setWrongFlash] = useState<{ idx: number; id: number }[]>([]);
  const [cooldown, setCooldown] = useState({ player: false, rival: false });
  const [attempted, setAttempted] = useState({ player: false, rival: false });
  const [allWrong, setAllWrong] = useState(false);
  const [winner, setWinner] = useState<{ actor: Actor; idx: number } | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [aims, setAims] = useState({ player: 0, rival: 0 });
  const [dims, setDims] = useState({ w: 900, h: 500 });

  const fieldRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const epoch = useRef(0);
  const startTime = useRef(Date.now());
  const finishedRef = useRef(false);
  const lockRef = useRef(false);
  const lastTickSec = useRef(-1);
  const aimTimers = useRef<Record<Actor, number | undefined>>({ player: undefined, rival: undefined });

  const phaseRef = useRef(phase);
  const cooldownRef = useRef(cooldown);
  const attemptedRef = useRef(attempted);
  const qiRef = useRef(qi);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { cooldownRef.current = cooldown; }, [cooldown]);
  useEffect(() => { attemptedRef.current = attempted; }, [attempted]);
  useEffect(() => { qiRef.current = qi; }, [qi]);

  const q: Question = questions[qi];
  const pal = PALETTES[playerColor];
  const rivalPal = rival.type === 'player' ? PALETTES[rival.color] : null;

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    (['player', 'rival'] as Actor[]).forEach((a) => {
      if (aimTimers.current[a]) clearTimeout(aimTimers.current[a]);
    });
  }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const { w, h } = dims;
  const mSize = Math.max(50, Math.min(h * 0.22, w * 0.12, 110));
  const shipW = Math.min(w * 0.26, h * 0.3 * (SHIP_VB_W / SHIP_VB_H), 260);
  const shipH = shipW * (SHIP_VB_H / SHIP_VB_W);
  const ufoW = Math.min(w * 0.22, h * 0.24 * (UFO_VB_W / UFO_VB_H), 210);
  const ufoH = ufoW * (UFO_VB_H / UFO_VB_W);

  const playerSlotY = 0.8;
  const rivalSlotY = 0.17;
  const playerLeft = w - w * 0.05 - shipW;
  const playerTop = playerSlotY * h - shipH * (NOSE_Y / SHIP_VB_H);
  const rivalIsUfo = rival.type === 'ufo';
  const rivalW = rivalIsUfo ? ufoW : shipW;
  const rivalH = rivalIsUfo ? ufoH : shipH;
  const rivalLeft = w - w * 0.07 - rivalW;
  const rivalNoseFracX = rivalIsUfo ? UFO_NOSE_X / UFO_VB_W : NOSE_X / SHIP_VB_W;
  const rivalNoseFracY = rivalIsUfo ? UFO_NOSE_Y / UFO_VB_H : NOSE_Y / SHIP_VB_H;
  const rivalTop = rivalSlotY * h - rivalH * rivalNoseFracY;

  const nose = useCallback(
    (actor: Actor) => {
      if (actor === 'player') {
        return { x: playerLeft + shipW * (NOSE_X / SHIP_VB_W), y: playerSlotY * h };
      }
      return { x: rivalLeft + rivalW * rivalNoseFracX, y: rivalSlotY * h };
    },
    [playerLeft, shipW, h, rivalLeft, rivalW, rivalNoseFracX]
  );

  const fire = useCallback(
    (actor: Actor, idx: number) => {
      if (phaseRef.current !== 'aim') return;
      if (cooldownRef.current[actor] || attemptedRef.current[actor]) return;
      const currentQ = questions[qiRef.current];
      if (!currentQ) return;
      const correct = currentQ.options[idx] === currentQ.answer;
      const id = Date.now() + Math.random();

      // Mark this actor as having used their 1 attempt for this question
      setAttempted((prev) => {
        const next = { ...prev, [actor]: true };
        return next;
      });

      if (correct) lockRef.current = true;
      setShots((s) => [...s, { id, actor, idx, correct }]);
      sfxLaser();
      // Rotate craft to aim at the targeted meteor
      const n = nose(actor);
      const t = MPOS[idx];
      const theta = (Math.atan2(t.y * h - n.y, t.x * w - n.x) * 180) / Math.PI;
      const rot = norm180(theta - 180);
      setAims((a) => ({ ...a, [actor]: rot }));
      if (aimTimers.current[actor]) clearTimeout(aimTimers.current[actor]);
      aimTimers.current[actor] = window.setTimeout(() => {
        setAims((a) => ({ ...a, [actor]: 0 }));
      }, 850);
      later(() => {
        if (phaseRef.current !== 'aim' && !lockRef.current) return;
        if (correct) {
          sfxBoom();
          setWinner({ actor, idx });
          setPhase('resolved');
          setScores((sc) => ({ ...sc, [actor]: sc[actor] + 1 }));
          const myEpoch = epoch.current;
          later(() => {
            if (epoch.current !== myEpoch) return;
            epoch.current++;
            lockRef.current = false;
            setWinner(null);
            setTimedOut(false);
            setAllWrong(false);
            setShots([]);
            setWrongFlash([]);
            setCooldown({ player: false, rival: false });
            setAttempted({ player: false, rival: false });
            if (qiRef.current + 1 >= questions.length) {
              setPhase('done');
            } else {
              setQi((v) => v + 1);
              setPhase('aim');
            }
          }, 1700);
        } else {
          if (lockRef.current && actor !== 'player' && actor !== 'rival') return;
          sfxWrong();
          setWrongFlash((wf) => [...wf, { idx, id }]);
          // No longer using general cooldown, instead they are locked out completely via 'attempted'
          // We check if BOTH players/actors have now attempted (or got it wrong)
          const otherActor: Actor = actor === 'player' ? 'rival' : 'player';
          const bothAttempted = attemptedRef.current[otherActor];
          
          later(() => setWrongFlash((wf) => wf.filter((x) => x.id !== id)), 550);

          if (bothAttempted) {
            setAllWrong(true);
            setPhase('resolved');
            const myEpoch = epoch.current;
            later(() => {
              if (epoch.current !== myEpoch) return;
              epoch.current++;
              lockRef.current = false;
              setWinner(null);
              setTimedOut(false);
              setAllWrong(false);
              setShots([]);
              setWrongFlash([]);
              setCooldown({ player: false, rival: false });
              setAttempted({ player: false, rival: false });
              if (qiRef.current + 1 >= questions.length) {
                setPhase('done');
              } else {
                setQi((v) => v + 1);
                setPhase('aim');
              }
            }, 2000);
          }
        }
      }, 300);
    },
    [nose, w, h, questions]
  );

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const pi = playerKeys.indexOf(k);
      if (pi >= 0) fire('player', pi);
      if (rival.type === 'player') {
        const ri = rival.keys.indexOf(k);
        if (ri >= 0) fire('rival', ri);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fire, playerKeys, rival]);

  // UFO AI
  useEffect(() => {
    if (!rivalIsUfo) return;
    if (phase !== 'aim') return;
    let cancelled = false;
    const myEpoch = epoch.current;
    const accuracy = Math.max(0.42, 0.68 - level * 0.03);
    const attempt = () => {
      if (cancelled || epoch.current !== myEpoch) return;
      const maxDelay = Math.max(450, timeLimit * 750);
      const delay = randInt(Math.min(400, Math.floor(maxDelay * 0.25)), Math.floor(maxDelay * 0.82));
      const t = window.setTimeout(() => {
        if (cancelled || epoch.current !== myEpoch || phaseRef.current !== 'aim' || attemptedRef.current.rival) {
          return;
        }
        const currentQ = questions[qiRef.current];
        const correctIdx = currentQ.options.findIndex((o) => o === currentQ.answer);
        let idx = correctIdx;
        if (Math.random() > accuracy) {
          const wrongs = [0, 1, 2].filter((i) => i !== correctIdx);
          idx = wrongs[randInt(0, wrongs.length - 1)];
        }
        fire('rival', idx);
      }, Math.max(500, delay));
      timers.current.push(t);
    };
    attempt();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, phase, rivalIsUfo, level, timeLimit]);

  // Per-question countdown
  useEffect(() => {
    if (phase !== 'aim') return;
    lockRef.current = false;
    lastTickSec.current = -1;
    setTimedOut(false);
    setTimeLeft(timeLimit);
    const start = Date.now();
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      if (lockRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (phaseRef.current !== 'aim') return;
      const left = Math.max(0, timeLimit - (Date.now() - start) / 1000);
      setTimeLeft(left);
      const sec = Math.ceil(left);
      if (sec !== lastTickSec.current) {
        lastTickSec.current = sec;
        if (sec <= 3 && sec > 0) sfxTick();
      }
      if (left <= 0) {
        stopped = true;
        sfxTimeout();
        setTimedOut(true);
        setPhase('resolved');
        const myEpoch = epoch.current;
        later(() => {
          if (epoch.current !== myEpoch) return;
          epoch.current++;
          lockRef.current = false;
          setWinner(null);
          setTimedOut(false);
          setShots([]);
          setWrongFlash([]);
          setCooldown({ player: false, rival: false });
          if (qiRef.current + 1 >= questions.length) {
            setPhase('done');
          } else {
            setQi((v) => v + 1);
            setPhase('aim');
          }
        }, 1800);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [qi, phase, timeLimit, questions.length]);

  useEffect(() => {
    if (phase === 'done' && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(scores.player, scores.rival, Date.now() - startTime.current);
    }
  }, [phase, scores, onFinish]);

  const streaks = useMemo(
    () => Array.from({ length: 12 }, () => ({ top: Math.random() * 100, w: 60 + Math.random() * 140, d: 0.6 + Math.random() * 1.2, delay: Math.random() * 2 })),
    []
  );

  const meteorState = (i: number): 'idle' | 'burn' | 'wrong' | 'dim' | 'correct-hint' => {
    if (winner) return winner.idx === i ? 'burn' : 'dim';
    if ((timedOut || allWrong) && q) return q.options[i] === q.answer ? 'correct-hint' : 'dim';
    if (wrongFlash.some((x) => x.idx === i)) return 'wrong';
    return 'idle';
  };

  const ringR = 20;
  const ringC = 2 * Math.PI * ringR;
  const ringPct = Math.max(0, Math.min(1, timeLeft / timeLimit));
  const urgent = phase === 'aim' && timeLeft <= 3;

  const laserColor = (actor: Actor) => (actor === 'player' ? pal.light : rivalIsUfo ? '#7dd3fc' : rivalPal!.light);
  const laserColor2 = (actor: Actor) => (actor === 'player' ? pal.main : rivalIsUfo ? '#0ea5e9' : rivalPal!.main);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* HUD */}
      <div className="relative z-30 flex items-center gap-1.5 px-2 py-1 md:gap-2 md:px-3 md:py-2">
        <div className="panel flex items-center gap-1.5 rounded-xl px-2 py-0.5 md:rounded-2xl md:px-3 md:py-1">
          <Ship color={playerColor} className="h-5 w-10 md:h-7 md:w-14" />
          <span className="text-xs font-bold md:text-sm" style={{ color: pal.light }}>{playerName}</span>
          <span className="font-orb rounded-lg bg-black/40 px-1.5 py-0.5 text-sm font-black text-amber-300 md:text-lg">{scores.player}</span>
          {attempted.player && phase === 'aim' && (
            <span className="rounded bg-red-950/80 px-1 text-[10px] font-bold text-red-300 border border-red-500/50">Terkunci</span>
          )}
        </div>
        <div className="panel min-w-0 flex-1 rounded-xl px-2 py-0.5 text-center md:rounded-2xl md:px-3 md:py-1">
          <div className="text-[11px] leading-tight text-violet-200 md:text-xs">Soal {Math.min(qi + 1, 10)}/10</div>
          <div className="relative mt-0.5 h-2 rounded-full bg-white/10 md:mt-1 md:h-2.5">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${((qi + (phase === 'done' ? 1 : 0)) / 10) * 100}%`, transition: 'width .5s' }} />
          </div>
        </div>
        {phase !== 'done' && (
          <div className={`panel relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0 md:h-12 md:w-12 ${urgent ? 'timer-urgent' : ''}`}>
            <svg viewBox="0 0 52 52" className="absolute h-10 w-10 -rotate-90 md:h-12 md:w-12">
              <circle cx="26" cy="26" r={ringR} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="5" />
              <circle
                cx="26" cy="26" r={ringR} fill="none"
                stroke={urgent ? '#f87171' : timedOut ? '#facc15' : '#fbbf24'}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringC * (1 - ringPct)}
                style={{ transition: 'stroke-dashoffset .05s linear' }}
              />
            </svg>
            <span className={`font-orb relative text-sm font-black md:text-base ${urgent ? 'text-red-300' : 'text-amber-200'}`}>
              {Math.max(0, Math.ceil(timeLeft))}
            </span>
          </div>
        )}
        <div className="panel flex items-center gap-1.5 rounded-xl px-2 py-0.5 md:rounded-2xl md:px-3 md:py-1">
          {attempted.rival && phase === 'aim' && (
            <span className="rounded bg-red-950/80 px-1 text-[10px] font-bold text-red-300 border border-red-500/50">Terkunci</span>
          )}
          <span className="font-orb rounded-lg bg-black/40 px-1.5 py-0.5 text-sm font-black text-amber-300 md:text-lg">{scores.rival}</span>
          <span className="text-xs font-bold md:text-sm" style={{ color: rivalIsUfo ? '#7dd3fc' : rivalPal!.light }}>{rivalIsUfo ? 'UFO Alien' : rival.name}</span>
          {rivalIsUfo ? <Ufo className="h-5 w-10 md:h-7 md:w-14" /> : <Ship color={rival.color} className="h-5 w-10 md:h-7 md:w-14" />}
        </div>
      </div>

      {/* Question */}
      {q && phase !== 'done' && (
        <div className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2" style={{ top: 46 }}>
          <div key={qi} className="pop panel rounded-xl px-4 py-0.5 text-center shadow-[0_0_30px_rgba(168,85,247,.5)] md:rounded-2xl md:px-6 md:py-1">
            <span className="font-orb text-2xl font-black tracking-wider sm:text-3xl md:text-5xl">
              {q.a} + {q.b} = <span className="text-amber-300">{winner ? q.answer : '?'}</span>
            </span>
            <div className="text-[10px] text-cyan-200 sm:text-xs">
              {attempted.player && !attempted.rival ? `${playerName} salah! Giliran lawan menembak! 🎯` : attempted.rival && !attempted.player ? `Lawan salah! Giliran ${playerName} menembak! 🎯` : `Siapa cepat, dia tembak duluan! ⚡ · ${timeLimit}s`}
            </div>
          </div>
        </div>
      )}

      {/* Field */}
      <div ref={fieldRef} className="relative flex-1">
        {streaks.map((s, i) => (
          <div key={i} className="streak" style={{ top: `${s.top}%`, width: s.w, animationDuration: `${s.d}s`, animationDelay: `${s.delay}s`, left: 0 }} />
        ))}

        {/* Meteors */}
        {q && phase !== 'done' &&
          q.options.map((opt, i) => (
            <div key={`${qi}-${i}`} className="absolute z-10" style={{ left: MPOS[i].x * w - mSize / 2, top: MPOS[i].y * h - mSize / 2 }}>
              <Meteor value={opt} size={mSize} state={meteorState(i)} onClick={() => fire('player', i)} delay={i * 110} />
            </div>
          ))}

        {/* Shots: lasers + muzzle flashes */}
        {shots.map((s) => {
          const n = nose(s.actor);
          const t = MPOS[s.idx];
          const tx = t.x * w, ty = t.y * h;
          const dx = tx - n.x, dy = ty - n.y;
          const dist = Math.hypot(dx, dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const c1 = laserColor(s.actor), c2 = laserColor2(s.actor);
          const thick = s.actor === 'player' ? 7 : 6;
          return (
            <div key={s.id}>
              <div
                className="pointer-events-none absolute z-20"
                style={{ left: n.x, top: n.y, width: dist, height: thick, transformOrigin: '0 50%', transform: `translateY(-50%) rotate(${angle}deg)` }}
              >
                <div className="laser-grow h-full w-full" style={{ background: `linear-gradient(90deg, #fff, ${c1} 35%, ${c2})`, boxShadow: `0 0 10px 3px ${c2}, 0 0 20px 5px ${c1}` }} />
              </div>
              <div
                className="muzzle pointer-events-none absolute z-20 rounded-full"
                style={{ left: n.x, top: n.y, width: 28, height: 28, background: `radial-gradient(circle, #fff, ${c1} 45%, transparent 70%)` }}
              />
            </div>
          );
        })}

        {/* Explosion on correct */}
        {winner && (
          <>
            <Explosion x={MPOS[winner.idx].x * w} y={MPOS[winner.idx].y * h} size={mSize} />
            <div
              className="float-up pointer-events-none absolute z-30 font-orb text-xl font-black md:text-2xl"
              style={{ left: MPOS[winner.idx].x * w + mSize * 0.6, top: MPOS[winner.idx].y * h - mSize * 0.9, color: winner.actor === 'player' ? '#86efac' : '#fca5a5', textShadow: '0 0 10px #000' }}
            >
              {winner.actor === 'player' ? `${playerName} menembak duluan! +1` : `${rivalIsUfo ? 'UFO' : rival.name} lebih cepat! +1`}
            </div>
          </>
        )}
        {timedOut && q && (
          <div className="pop pointer-events-none absolute bottom-14 left-1/2 z-30 -translate-x-1/2 rounded-2xl border-2 border-amber-300 bg-black/80 px-5 py-2 text-center font-bold text-amber-100 shadow-[0_0_20px_rgba(251,191,36,.6)]">
            ⏰ Waktu habis! Jawaban: <span className="font-orb text-green-300">{q.a} + {q.b} = {q.answer}</span>
          </div>
        )}
        {allWrong && q && (
          <div className="pop pointer-events-none absolute bottom-14 left-1/2 z-30 -translate-x-1/2 rounded-2xl border-2 border-red-500 bg-black/85 px-5 py-2 text-center font-bold text-red-200 shadow-[0_0_20px_rgba(239,68,68,.6)]">
            ❌ Semua salah menjawab! Jawaban: <span className="font-orb text-green-300">{q.a} + {q.b} = {q.answer}</span>
          </div>
        )}

        {/* Player ship */}
        <div className="absolute z-20" style={{ left: playerLeft, top: playerTop, width: shipW, height: shipH }}>
          <div className="ship-hover h-full w-full">
            <div
              className="h-full w-full"
              style={{
                transform: `rotate(${aims.player}deg)`,
                transformOrigin: `${(NOSE_X / SHIP_VB_W) * 100}% ${(NOSE_Y / SHIP_VB_H) * 100}%`,
                transition: 'transform .18s ease-out',
              }}
            >
              <Ship color={playerColor} className="h-full w-full drop-shadow-[0_0_12px_rgba(255,255,255,.25)]" />
            </div>
          </div>
        </div>

        {/* Rival (UFO or player 2) */}
        <div className="absolute z-20" style={{ left: rivalLeft, top: rivalTop, width: rivalW, height: rivalH }}>
          <div className="ship-hover h-full w-full" style={{ animationDelay: '0.4s' }}>
            <div
              className="h-full w-full"
              style={{
                transform: `rotate(${aims.rival}deg)`,
                transformOrigin: `${rivalNoseFracX * 100}% ${rivalNoseFracY * 100}%`,
                transition: 'transform .18s ease-out',
              }}
            >
              {rivalIsUfo ? (
                <Ufo className="h-full w-full drop-shadow-[0_0_14px_rgba(56,189,248,.55)]" />
              ) : (
                <Ship color={rival.color} className="h-full w-full drop-shadow-[0_0_12px_rgba(255,255,255,.25)]" />
              )}
            </div>
          </div>
        </div>

        {phase === 'done' && (
          <div className="pop absolute inset-0 z-40 flex items-center justify-center">
            <div className="panel rounded-3xl px-8 py-4 text-center">
              <div className="font-orb text-2xl font-black text-amber-300">PERTEMPURAN SELESAI!</div>
              <div className="text-lg">Menghitung hasil...</div>
            </div>
          </div>
        )}
      </div>

      {/* Control pads for touch / clarity */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex items-end justify-between px-2">
        <Pad label={playerName} keys={playerKeys} color={pal.main} onPress={(i) => fire('player', i)} disabled={phase !== 'aim' || attempted.player} />
        {rival.type === 'player' && (
          <Pad label={rival.name} keys={rival.keys} color={rivalPal!.main} onPress={(i) => fire('rival', i)} disabled={phase !== 'aim' || attempted.rival} align="right" />
        )}
      </div>
    </div>
  );
}

function Pad({ label, keys, color, onPress, disabled, align = 'left' }: { label: string; keys: string[]; color: string; onPress: (i: number) => void; disabled: boolean; align?: 'left' | 'right' }) {
  return (
    <div className={`pointer-events-auto flex flex-col items-${align === 'right' ? 'end' : 'start'} gap-0.5`}>
      <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white/90 md:text-xs">
        {label} {disabled ? '⛔ (Terkunci)' : ''}
      </span>
      <div className="flex gap-1 sm:gap-1.5">
        {keys.map((k, i) => (
          <button
            key={k}
            disabled={disabled}
            onClick={() => onPress(i)}
            className="pad-btn flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xs font-black text-white shadow-lg active:scale-90 sm:h-11 sm:w-11 sm:rounded-xl sm:text-sm"
            style={{ background: `linear-gradient(180deg, ${color}, #000000cc)`, borderColor: color }}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
