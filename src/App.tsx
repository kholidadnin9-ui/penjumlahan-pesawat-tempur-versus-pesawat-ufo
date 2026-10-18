import { useCallback, useEffect, useMemo, useState } from 'react';
import Ship from './components/Ship';
import Ufo from './components/Ufo';
import Battlefield, { RivalKind } from './components/Battlefield';
import { LEVELS } from './game/questions';
import { PALETTES, ShipColor, SHIP_ORDER } from './game/ships';
import { isMuted, setMuted, sfxClick, sfxWin } from './game/sound';

type Screen = 'menu' | 'ships' | 'levels' | 'play' | 'result';

const STORE = 'galaksi-penjumlahan-stars';
const TIMER_STORE = 'galaksi-penjumlahan-timer';
const starsFor = (s: number) => (s >= 9 ? 3 : s >= 7 ? 2 : s >= 5 ? 1 : 0);
const KEYS_P1 = ['a', 's', 'd'];
const KEYS_P2 = ['j', 'k', 'l'];
const TIMER_PRESETS = [5, 10, 15, 20, 30];

function SpaceBackground() {
  const sparks = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      left: `${(i * 17 + 7) % 100}%`,
      top: `${(i * 29 + 11) % 100}%`,
      delay: `${(i % 6) * 0.35}s`,
    })),
    []
  );
  const meteors = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({
      size: 22 + ((i * 13) % 26),
      top: 8 + ((i * 23) % 78),
      duration: 9 + ((i * 7) % 9),
      delay: i * 2.4,
    })),
    []
  );
  return (
    <div className="space-bg pointer-events-none fixed inset-0 overflow-hidden">
      <div className="stars s1" />
      <div className="stars s2" />
      {/* Nebula clouds */}
      <div className="absolute -left-24 top-[8%] h-72 w-72 rounded-full opacity-70" style={{ background: 'radial-gradient(circle at 35% 35%, #fda4af, #be185d 48%, #500724 80%)', boxShadow: '0 0 90px rgba(236,72,153,.55)' }} />
      <div className="absolute -right-16 -bottom-10 h-80 w-80 rounded-full opacity-55" style={{ background: 'radial-gradient(circle at 40% 35%, #a78bfa, #4c1d95 55%, #1e1b4b 85%)', boxShadow: '0 0 100px rgba(139,92,246,.5)' }} />
      <div className="absolute right-[-40px] top-[18%] h-40 w-40 rounded-full opacity-60" style={{ background: 'radial-gradient(circle at 35% 35%, #fde68a, #d97706 55%, #78350f)', boxShadow: '0 0 50px rgba(251,191,36,.4)' }} />
      <div className="absolute bottom-[6%] right-[28%] h-28 w-28 rounded-full opacity-55" style={{ background: 'radial-gradient(circle at 35% 35%, #a5f3fc, #0e7490 60%, #083344)' }} />
      <div className="absolute left-[30%] top-[55%] h-20 w-20 rounded-full opacity-40" style={{ background: 'radial-gradient(circle at 35% 35%, #86efac, #15803d 60%, #052e16)' }} />
      {/* Decorative meteors drifting */}
      {meteors.map((m, i) => (
        <div
          key={i}
          className="dash-meteor"
          style={{
            width: m.size, height: m.size,
            right: '-60px', top: `${m.top}%`,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
      {sparks.map((s, i) => (
        <span key={i} className="spark" style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
      ))}
    </div>
  );
}

function Stars({ n, size = 'text-3xl' }: { n: number; size?: string }) {
  return (
    <div className={`flex gap-1 ${size}`}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ filter: i < n ? 'drop-shadow(0 0 8px #fbbf24)' : 'grayscale(1) opacity(.3)' }}>⭐</span>
      ))}
    </div>
  );
}

function TimerPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="panel w-full max-w-xl rounded-3xl p-4 text-left">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-bold text-amber-200">⏱️ Waktu menjawab tiap soal</div>
        <div className="font-orb rounded-xl bg-black/50 px-3 py-1 text-2xl font-black text-amber-300" style={{ textShadow: '0 0 10px #fbbf24' }}>
          {value}<span className="text-sm text-white"> dtk</span>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={30}
        value={value}
        onChange={(e) => { onChange(Number(e.target.value)); sfxClick(); }}
        className="timer-range"
        aria-label="Timer menjawab 1 sampai 30 detik"
      />
      <div className="mt-1 flex justify-between text-xs text-violet-200">
        <span>1 detik</span><span>15</span><span>30 detik</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIMER_PRESETS.map((n) => (
          <button
            key={n}
            onClick={() => { onChange(n); sfxClick(); }}
            className={`rounded-xl px-3 py-1 text-sm font-bold ${value === n ? 'bg-amber-300 text-black shadow-[0_0_12px_#fbbf24]' : 'bg-black/40 text-white hover:bg-white/10'}`}
          >
            {n}s
          </button>
        ))}
      </div>
    </div>
  );
}

function loadTimer() {
  try {
    const n = Number(localStorage.getItem(TIMER_STORE));
    if (n >= 1 && n <= 30) return n;
  } catch { /* ignore */ }
  return 15;
}

type ModeCardProps = {
  title: string;
  subtitle: string;
  gradient: string;   // vivid card background
  glow: string;       // outer glow color
  ring: string;       // sharp outer ring color
  badgeText: string;  // badge text color
  onClick: () => void;
  children: React.ReactNode; // ship/ufo preview
  badge: string;
  cta: string;
};

function ModeCard({ title, subtitle, gradient, glow, ring, badgeText, onClick, children, badge, cta }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className="mode-card cockpit-texture group w-full border-[3px] border-white p-5 text-left text-white"
      style={{
        background: gradient,
        boxShadow: `0 0 0 4px ${ring}, 0 16px 36px -6px ${glow}, 0 0 44px ${glow}, inset 0 2px 0 rgba(255,255,255,.55)`,
      }}
    >
      {/* corner brackets (HUD frame) */}
      <span className="corner-bracket cb-tl" style={{ color: '#fff' }} />
      <span className="corner-bracket cb-tr" style={{ color: '#fff' }} />
      <span className="corner-bracket cb-bl" style={{ color: '#fff' }} />
      <span className="corner-bracket cb-br" style={{ color: '#fff' }} />

      {/* HUD ticks */}
      <div className="hud-ticks">
        <span style={{ animationDelay: '0s' }} />
        <span style={{ animationDelay: '.2s' }} />
        <span style={{ animationDelay: '.4s' }} />
        <span style={{ animationDelay: '.6s' }} />
      </div>

      {/* badge */}
      <div
        className="mb-3 inline-block rounded-full bg-white px-3 py-0.5 text-xs font-black uppercase tracking-widest"
        style={{ color: badgeText, boxShadow: '0 3px 0 rgba(0,0,0,.25)' }}
      >
        {badge}
      </div>

      {/* Ship preview bay — bright spotlight */}
      <div
        className="relative mb-3 overflow-hidden rounded-2xl border-[3px] border-white"
        style={{ background: 'radial-gradient(ellipse at 55% 40%, #ffffff 0%, #e6f6ff 45%, #8fd0ff 100%)', boxShadow: 'inset 0 -10px 24px rgba(30,100,255,.25)' }}
      >
        <div className="ship-hover relative px-3 py-3">{children}</div>
        {/* bay grid floor */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-5"
          style={{ background: 'repeating-linear-gradient(90deg, rgba(30,100,255,.35) 0 3px, transparent 3px 16px)' }}
        />
      </div>

      <div className="font-orb text-3xl font-black tracking-wide text-white" style={{ textShadow: '0 3px 0 rgba(0,0,0,.35), 0 0 18px rgba(255,255,255,.55)' }}>{title}</div>
      <div className="mt-1 text-sm font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,.65)' }}>{subtitle}</div>

      <div
        className="launch-btn mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-white px-4 py-2 text-sm font-black"
        style={{ background: 'linear-gradient(180deg,#fff75a,#ffc400)', color: '#1a1200', boxShadow: '0 4px 0 #b45309, 0 0 20px rgba(255,230,0,.8)' }}
      >
        {cta} <span aria-hidden>🚀</span>
      </div>
    </button>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [players, setPlayers] = useState<1 | 2>(1);
  const [names, setNames] = useState(['Pemain 1', 'Pemain 2']);
  const [colors, setColors] = useState<ShipColor[]>(['merah', 'hijau']);
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(0);
  const [timeLimit, setTimeLimitState] = useState(loadTimer);
  const [result, setResult] = useState<{ player: number; rival: number; time: number } | null>(null);
  const [best, setBest] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; }
  });
  const [muted, setMutedState] = useState(isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const setTimeLimit = (n: number) => {
    const v = Math.max(1, Math.min(30, Math.round(n)));
    setTimeLimitState(v);
    try { localStorage.setItem(TIMER_STORE, String(v)); } catch { /* ignore */ }
  };

  const go = (s: Screen) => { sfxClick(); setScreen(s); };

  const startLevel = (lv: number) => {
    sfxClick();
    setLevel(lv);
    setResult(null);
    setRound((r) => r + 1);
    setScreen('play');
  };

  const handleFinish = useCallback((p: number, r: number, t: number) => {
    setResult({ player: p, rival: r, time: t });
  }, []);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      const top = Math.max(result.player, players === 2 ? result.rival : result.player);
      const st = starsFor(top);
      setBest((b) => {
        const nb = { ...b, [level]: Math.max(b[level] || 0, st) };
        localStorage.setItem(STORE, JSON.stringify(nb));
        return nb;
      });
      sfxWin();
      setScreen('result');
    }, 1200);
    return () => clearTimeout(t);
  }, [result, players, level]);

  const toggleMute = () => { setMuted(!muted); setMutedState(!muted); };

  // Fullscreen support
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (document.documentElement as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed', e);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Detect orientation for mobile reminder
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 850;
      setIsPortrait(portrait);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const lv = LEVELS[level - 1];

  const rival: RivalKind = useMemo(
    () => (players === 2 ? { type: 'player', color: colors[1], name: names[1] || 'Pemain 2', keys: KEYS_P2 } : { type: 'ufo' }),
    [players, colors, names]
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SpaceBackground />

      {/* Floating Header Controls: Mute + Fullscreen */}
      <div className="fixed right-2 top-2 z-50 flex items-center gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
        <button
          onClick={toggleFullscreen}
          className="panel flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-cyan-200 transition hover:border-cyan-300 sm:px-3 sm:py-1 sm:text-sm"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          <span>{isFullscreen ? '🗗' : '⛶'}</span>
          <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
        </button>
        <button
          onClick={toggleMute}
          className="panel rounded-full px-2.5 py-1 text-base transition hover:border-cyan-300 sm:px-3 sm:py-1 sm:text-lg"
          title={muted ? 'Aktifkan Suara' : 'Bisukan'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Landscape Orientation Hint for Mobile (if device is portrait) */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md">
          <div className="rotate-phone-anim text-6xl">📱</div>
          <div className="font-orb mt-4 text-2xl font-black text-amber-300">PUTAR KE LANDSCAPE</div>
          <p className="mt-2 max-w-sm text-sm text-violet-200">
            Game balapan pesawat ini dirancang untuk layar mendatar (Landscape) agar pertempuran dan meteor terlihat luas &amp; seru!
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                toggleFullscreen();
                setIsPortrait(false);
              }}
              className="btn-space rounded-2xl px-5 py-2.5 text-sm font-bold"
            >
              ⛶ Masuk Layar Penuh &amp; Main
            </button>
            <button
              onClick={() => setIsPortrait(false)}
              className="panel rounded-2xl px-4 py-2 text-xs font-bold text-violet-300"
            >
              Lanjutkan Saja
            </button>
          </div>
        </div>
      )}

      {/* MENU */}
      {screen === 'menu' && (
        <div className="relative z-10 flex h-full flex-col overflow-y-auto">
          <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pb-8 pt-3 text-center">

            {/* EPIC TITLE BLOCK */}
            <div className="relative pop mt-1">
              <div className="hero-ring pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <div className="relative">
                <div className="mb-2 inline-block rounded-full border border-cyan-300/70 bg-black/60 px-5 py-1 text-xs font-bold tracking-[.3em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,.55)] md:text-sm">
                  ✨ 🚀 MATEMATIKA KELAS 2 SD 🚀 ✨
                </div>
                <h1 className="title-epic font-orb text-5xl font-black leading-[0.95] tracking-tight md:text-8xl">GALAKSI</h1>
                <h1 className="title-sub-epic font-orb text-3xl font-black leading-tight tracking-tight md:text-6xl">PENJUMLAHAN</h1>
                <div className="credit-badge mx-auto mt-3 inline-block rounded-full px-4 py-1 text-sm font-bold md:text-base">
                  created by: <span className="text-white">widodo guru sd</span>
                </div>
                <p className="mt-3 text-base font-semibold text-white md:text-lg" style={{ textShadow: '0 0 8px #000, 0 0 18px #7c3aed' }}>
                  Balapan menembak meteor jawaban benar secepat mungkin! ⚡
                </p>
                <p className="text-sm font-medium text-cyan-100">Penjumlahan 1–100 · Tanpa &amp; dengan menyimpan</p>
              </div>
            </div>

            {/* MODE CARDS (cockpit style) */}
            <div className="relative z-30 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
              <ModeCard
                badge="⭐ Misi Solo"
                title="1 PEMAIN"
                subtitle="Lawan pesawat UFO Alien — jadilah pilot tercepat & raih skor tertinggi!"
                gradient="linear-gradient(155deg, #ff1f4b 0%, #ff6a00 52%, #ffd000 118%)"
                glow="rgba(255,106,0,.85)"
                ring="#fff200"
                badgeText="#d10030"
                onClick={() => { setPlayers(1); go('ships'); }}
                cta="Luncurkan Pesawat"
              >
                <div className="flex items-center justify-center gap-2">
                  <Ship color="merah" className="h-16 w-32 drop-shadow-[0_5px_5px_rgba(0,0,0,.4)]" />
                  <span className="font-orb text-2xl font-black text-[#0b1d4d]" style={{ textShadow: '0 2px 0 #fff' }}>VS</span>
                  <Ufo className="h-[4.5rem] w-28 drop-shadow-[0_5px_5px_rgba(0,0,0,.4)]" />
                </div>
              </ModeCard>

              <ModeCard
                badge="⚔️ Duel Antar Bintang"
                title="2 PEMAIN"
                subtitle="Battle 1 soal — rebutan tembak meteor jawaban benar duluan! P1: A S D · P2: J K L"
                gradient="linear-gradient(155deg, #ff22d8 0%, #9a2cff 55%, #1fa2ff 120%)"
                glow="rgba(200,60,255,.85)"
                ring="#00f0ff"
                badgeText="#8400d6"
                onClick={() => { setPlayers(2); go('ships'); }}
                cta="Mulai Pertempuran"
              >
                <div className="flex items-center justify-center gap-2">
                  <Ship color="pink" className="h-16 w-32 drop-shadow-[0_5px_5px_rgba(0,0,0,.4)]" />
                  <span className="text-2xl" style={{ filter: 'drop-shadow(0 2px 0 #fff)' }}>⚔️</span>
                  <Ship color="ungu" className="h-16 w-32 drop-shadow-[0_5px_5px_rgba(0,0,0,.4)]" />
                </div>
              </ModeCard>
            </div>

            <TimerPicker value={timeLimit} onChange={setTimeLimit} />

            <div className="panel cockpit-texture relative w-full max-w-xl rounded-2xl p-4 text-left text-sm md:text-base">
              <b className="text-amber-300">🛰️ Cara bermain:</b>
              <ul className="mt-1 list-disc pl-5 text-violet-100">
                <li>5 level, tiap level 10 soal. Satu soal untuk semua — <b>bukan gantian</b>, tapi <b>berebut siapa paling cepat</b>.</li>
                <li>1 Pemain vs <b>UFO alien</b>. 2 Pemain: tombol <b>A S D</b> vs <b>J K L</b>.</li>
                <li>Jawaban benar = meteor meledak 💥. Jawaban salah = lawan dapat giliran! Waktu habis = soal dilewati.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SHIP SELECT */}
      {screen === 'ships' && (
        <div className="relative z-10 flex h-full flex-col items-center gap-4 overflow-y-auto p-4">
          <h2 className="title-glow font-orb mt-2 text-3xl font-black md:text-4xl">PILIH PESAWATMU</h2>
          <div className="credit-badge rounded-full px-3 py-0.5 text-xs font-bold">created by: <span className="text-white">widodo guru sd</span></div>
          <div className={`grid w-full max-w-6xl gap-4 ${players === 2 ? 'md:grid-cols-2' : 'max-w-xl md:max-w-4xl md:grid-cols-2'}`}>
            {Array.from({ length: players }, (_, p) => (
              <div key={p} className="panel rounded-3xl p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-cyan-300">Pemain {p + 1}</span>
                  <input
                    value={names[p]}
                    maxLength={14}
                    onChange={(e) => setNames((n) => n.map((v, i) => (i === p ? e.target.value : v)))}
                    className="rounded-xl border-2 border-violet-400/50 bg-black/40 px-3 py-1 text-white outline-none focus:border-cyan-300"
                  />
                  <span className="text-xs text-violet-300">Tombol: {players === 2 ? (p === 0 ? 'A S D' : 'J K L') : 'A S D / klik meteor'}</span>
                </div>
                <div className="flex justify-center">
                  <div className="ship-hover w-full max-w-sm"><Ship color={colors[p]} className="h-auto w-full" /></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {SHIP_ORDER.map((c) => (
                    <button
                      key={c}
                      onClick={() => { sfxClick(); setColors((cs) => cs.map((v, i) => (i === p ? c : v))); }}
                      className={`flex flex-col items-center rounded-2xl border-2 p-1 transition ${colors[p] === c ? 'scale-105 bg-white/15' : 'border-transparent bg-black/30 hover:bg-white/10'}`}
                      style={{ borderColor: colors[p] === c ? PALETTES[c].main : undefined }}
                    >
                      <Ship color={c} className="h-10 w-20" />
                      <span className="text-sm font-bold" style={{ color: PALETTES[c].light }}>{PALETTES[c].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {players === 1 && (
              <div className="panel rounded-3xl p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-lg font-bold text-sky-300">Lawanmu</span>
                  <span className="rounded-xl bg-black/40 px-3 py-1 font-bold text-sky-200">🛸 UFO Alien</span>
                </div>
                <div className="flex justify-center">
                  <div className="ship-hover w-full max-w-sm"><Ufo className="h-auto w-full drop-shadow-[0_0_16px_rgba(56,189,248,.55)]" /></div>
                </div>
                <p className="mt-3 text-center text-violet-200">UFO ini juga akan mencoba menjawab soal. Jadilah yang tercepat dan tepat untuk mengalahkannya! 👾</p>
              </div>
            )}
          </div>
          <TimerPicker value={timeLimit} onChange={setTimeLimit} />
          <div className="flex gap-3 pb-4">
            <button onClick={() => go('menu')} className="panel rounded-2xl px-6 py-3 text-xl font-bold">← Kembali</button>
            <button onClick={() => go('levels')} className="btn-space rounded-2xl px-8 py-3 text-xl font-bold">Lanjut 🚀</button>
          </div>
        </div>
      )}

      {/* LEVEL SELECT */}
      {screen === 'levels' && (
        <div className="relative z-10 flex h-full flex-col items-center gap-4 overflow-y-auto p-4">
          <h2 className="title-glow font-orb mt-2 text-3xl font-black md:text-4xl">PILIH LEVEL</h2>
          <div className="credit-badge rounded-full px-3 py-0.5 text-xs font-bold">created by: <span className="text-white">widodo guru sd</span></div>
          <div className="panel rounded-2xl px-4 py-2 text-sm font-bold text-amber-200">⏱️ Timer: {timeLimit} detik / soal</div>
          <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((l, i) => (
              <button key={l.id} onClick={() => startLevel(l.id)} className="pop panel group rounded-3xl p-4 text-left transition hover:scale-[1.03] hover:border-cyan-300" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between">
                  <span className="font-orb text-2xl font-black text-amber-300">{l.name}</span>
                  <Stars n={best[l.id] || 0} size="text-xl" />
                </div>
                <div className="text-xl font-bold text-cyan-200">🪐 {l.title}</div>
                <div className="text-violet-200">{l.desc}</div>
                <div className="mt-2 inline-block rounded-xl bg-black/40 px-3 py-1 font-orb text-lg">Contoh: {l.example}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 pb-4">
            <button onClick={() => go('ships')} className="panel rounded-2xl px-6 py-3 text-xl font-bold">← Ganti Pesawat</button>
          </div>
        </div>
      )}

      {/* PLAY */}
      {screen === 'play' && (
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center gap-2 px-2 pt-1.5 pr-28 sm:gap-3 sm:px-3 sm:pt-2">
            <button onClick={() => go('levels')} className="panel rounded-xl px-2.5 py-0.5 text-xs font-bold sm:px-3 sm:py-1 sm:text-sm">✕ Keluar</button>
            <span className="font-orb text-sm font-black text-amber-300 sm:text-base">{lv.name}</span>
            <span className="hidden text-xs text-violet-200 md:inline">• {lv.title} — {lv.desc}</span>
            <span className="ml-auto rounded-xl bg-black/40 px-2 py-0.5 text-xs font-bold text-amber-200 sm:text-sm">⏱️ {timeLimit}s</span>
          </div>
          <div className="min-h-0 flex-1">
            <Battlefield
              key={round}
              level={level}
              playerName={names[0] || 'Pemain 1'}
              playerColor={colors[0]}
              playerKeys={KEYS_P1}
              rival={rival}
              timeLimit={timeLimit}
              onFinish={handleFinish}
            />
          </div>
        </div>
      )}

      {/* RESULT */}
      {screen === 'result' && result && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 overflow-y-auto p-4 text-center">
          <h2 className="title-glow font-orb pop text-3xl font-black md:text-5xl">
            {level === 5 ? 'MISI SELESAI!' : `${lv.name.toUpperCase()} SELESAI!`}
          </h2>
          <div className="credit-badge rounded-full px-3 py-0.5 text-xs font-bold">created by: <span className="text-white">widodo guru sd</span></div>
          <div className="pop text-2xl font-bold text-amber-300">
            {result.player === result.rival
              ? '🤝 Seri! Pertempuran sengit!'
              : result.player > result.rival
              ? `🏆 ${names[0] || 'Pemain 1'} Menang!`
              : `🏆 ${players === 2 ? (names[1] || 'Pemain 2') : 'UFO Alien'} Menang!`}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="pop panel w-72 rounded-3xl p-5">
              <div className="ship-hover mx-auto w-48"><Ship color={colors[0]} className="h-auto w-full" /></div>
              <div className="mt-2 text-xl font-bold" style={{ color: PALETTES[colors[0]].light }}>{names[0] || 'Pemain 1'}</div>
              <div className="font-orb text-4xl font-black">{result.player}/10</div>
              <div className="flex justify-center"><Stars n={starsFor(result.player)} /></div>
              <div className="mt-1 text-cyan-200">
                {starsFor(result.player) === 3 ? 'Luar biasa, Kapten! 🚀' : starsFor(result.player) === 2 ? 'Hebat! Terus berlatih! 👍' : starsFor(result.player) === 1 ? 'Bagus! Ayo coba lagi! 💪' : 'Jangan menyerah, coba lagi ya! 🌟'}
              </div>
            </div>
            <div className="pop panel w-72 rounded-3xl p-5" style={{ animationDelay: '150ms' }}>
              <div className="ship-hover mx-auto w-48">
                {players === 2 ? <Ship color={colors[1]} className="h-auto w-full" /> : <Ufo className="h-auto w-full" />}
              </div>
              <div className="mt-2 text-xl font-bold" style={{ color: players === 2 ? PALETTES[colors[1]].light : '#7dd3fc' }}>
                {players === 2 ? names[1] || 'Pemain 2' : 'UFO Alien'}
              </div>
              <div className="font-orb text-4xl font-black">{result.rival}/10</div>
              {players === 2 && <div className="flex justify-center"><Stars n={starsFor(result.rival)} /></div>}
            </div>
          </div>
          <div className="text-sm text-violet-200">Waktu pertempuran: {(result.time / 1000).toFixed(1)} detik · Timer soal: {timeLimit}s</div>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => startLevel(level)} className="panel rounded-2xl px-6 py-3 text-xl font-bold">🔁 Ulangi</button>
            {level < 5 && (
              <button onClick={() => startLevel(level + 1)} className="btn-space rounded-2xl px-8 py-3 text-xl font-bold">Level {level + 1} ➜</button>
            )}
            <button onClick={() => go('levels')} className="panel rounded-2xl px-6 py-3 text-xl font-bold">🗺️ Pilih Level</button>
            <button onClick={() => go('menu')} className="panel rounded-2xl px-6 py-3 text-xl font-bold">🏠 Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
