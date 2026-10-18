import { useId } from 'react';
import { PALETTES, ShipColor, SHIP_VB_H, SHIP_VB_W } from '../game/ships';

function Missile({ x, y, len, tip, id }: { x: number; y: number; len: number; tip: string; id: string }) {
  return (
    <g>
      <rect x={x} y={y - 4.5} width={len} height={9} rx={3} fill={`url(#metal-${id})`} stroke="#334155" strokeWidth={0.8} />
      <rect x={x + len * 0.35} y={y - 4.5} width={3} height={9} fill="#1e293b" />
      <rect x={x + len * 0.7} y={y - 4.5} width={3} height={9} fill="#1e293b" />
      <path d={`M${x},${y - 4.5} L${x - 16},${y} L${x},${y + 4.5} Z`} fill={tip} stroke="#00000055" strokeWidth={0.6} />
    </g>
  );
}

function Flame({ x, y, h, len, id }: { x: number; y: number; h: number; len: number; id: string }) {
  return (
    <path
      className="flame"
      d={`M${x},${y - h / 2} Q${x + len * 0.5},${y - h * 0.7} ${x + len},${y} Q${x + len * 0.5},${y + h * 0.7} ${x},${y + h / 2} Z`}
      fill={`url(#flame-${id})`}
    />
  );
}

export default function Ship({ color, className = '', style }: { color: ShipColor; className?: string; style?: React.CSSProperties }) {
  const p = PALETTES[color];
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox={`0 0 ${SHIP_VB_W} ${SHIP_VB_H}`} className={className} style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={`body-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.45" stopColor={p.main} />
          <stop offset="1" stopColor={p.dark} />
        </linearGradient>
        <linearGradient id={`wing-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="1" stopColor={p.main} />
        </linearGradient>
        <linearGradient id={`nose-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#64748b" />
          <stop offset="0.5" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="0.35" stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={`metal-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`flame-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.2" stopColor={p.flame1} />
          <stop offset="0.6" stopColor={p.flame2} stopOpacity="0.8" />
          <stop offset="1" stopColor={p.flame2} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Flames (behind) */}
      <g filter={`url(#glow-${id})`} opacity={0.7}>
        <Flame x={278} y={64} h={18} len={70} id={id} />
        <Flame x={282} y={96} h={20} len={80} id={id} />
      </g>
      <Flame x={278} y={64} h={12} len={58} id={id} />
      <Flame x={282} y={96} h={14} len={66} id={id} />

      {/* Far tail fin */}
      <path d="M196,66 L222,8 L242,6 L238,66 Z" fill={`url(#wing-${id})`} stroke={p.dark} strokeWidth={1.5} />
      <path d="M222,8 L242,6 L240,18 L218,20 Z" fill={p.dark} />
      <rect x="226" y="22" width="10" height="3" fill="#fb923c" />

      {/* Far (upper) wing + missiles */}
      <path d="M96,82 L138,24 L170,20 L214,72 Z" fill={`url(#wing-${id})`} stroke={p.dark} strokeWidth={1.5} />
      <path d="M130,40 L160,34 L172,52 L140,58 Z" fill={p.dark} opacity={0.75} />
      <path d="M150,60 L180,56 L188,66 L160,70 Z" fill="#ffffff" opacity={0.55} />
      <Missile x={76} y={34} len={56} tip={p.tip} id={id} />
      <Missile x={86} y={48} len={56} tip={p.tip} id={id} />
      <Missile x={96} y={62} len={52} tip={p.tip} id={id} />

      {/* Upper engine */}
      <rect x="226" y="54" width="54" height="20" rx="6" fill={`url(#metal-${id})`} stroke="#334155" />
      <rect x="244" y="54" width="4" height="20" fill="#334155" />
      <rect x="262" y="54" width="4" height="20" fill="#334155" />
      <ellipse cx="280" cy="64" rx="5" ry="10" fill="#f97316" />

      {/* Fuselage */}
      <path
        d="M4,100 L58,86 Q110,70 170,68 L250,66 L284,76 L286,106 L250,116 L150,122 L62,114 Z"
        fill={`url(#body-${id})`}
        stroke={p.dark}
        strokeWidth={1.5}
      />
      {/* Camo patches */}
      <path d="M168,74 L204,71 L194,86 L162,88 Z" fill={p.dark} opacity={0.8} />
      <path d="M214,72 L246,70 L240,82 L210,84 Z" fill={p.dark} opacity={0.6} />
      <path d="M110,102 L186,96 L182,103 L106,109 Z" fill="#ffffff" opacity={0.7} />
      <path d="M200,92 L250,88 L246,96 L198,99 Z" fill="#ffffff" opacity={0.5} />
      <path d="M70,106 L120,104 L116,110 L74,112 Z" fill={p.dark} opacity={0.6} />

      {/* Nose cone */}
      <path d="M4,100 L58,86 Q68,100 62,114 Z" fill={`url(#nose-${id})`} />
      <path d="M4,100 L20,96 L19,104 Z" fill={p.tip} />
      <path d="M58,86 Q68,100 62,114" fill="none" stroke="#f59e0b" strokeWidth={2} />

      {/* Cockpit canopy */}
      <path d="M66,92 Q92,64 140,68 Q158,72 160,86 Q120,96 66,92 Z" fill={`url(#glass-${id})`} stroke="#f59e0b" strokeWidth={3} />
      <path d="M112,70 Q116,82 116,92" fill="none" stroke="#f59e0b" strokeWidth={2.5} />
      <path d="M80,86 Q96,72 112,72" fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />

      {/* Intake */}
      <path d="M138,104 L186,102 L188,132 L140,132 Z" fill="#1e293b" stroke="#0f172a" strokeWidth={1.5} />
      <rect x="152" y="108" width="5" height="18" rx="2" fill="#fb923c" />
      <rect x="164" y="108" width="5" height="18" rx="2" fill="#fb923c" opacity={0.8} />

      {/* Lower engine */}
      <rect x="236" y="86" width="50" height="22" rx="6" fill={`url(#metal-${id})`} stroke="#334155" />
      <rect x="254" y="86" width="4" height="22" fill="#334155" />
      <rect x="270" y="86" width="4" height="22" fill="#334155" />
      <ellipse cx="286" cy="97" rx="5" ry="11" fill="#f97316" />

      {/* Near tail fin */}
      <path d="M238,80 L282,30 L300,32 L282,86 Z" fill={`url(#wing-${id})`} stroke={p.dark} strokeWidth={1.5} />
      <path d="M282,30 L300,32 L296,44 L272,44 Z" fill={p.dark} />
      <rect x="278" y="48" width="12" height="3" fill="#fb923c" transform="rotate(-50 284 50)" />

      {/* Near (lower) wing + missiles */}
      <path d="M150,112 L236,104 L300,148 L252,152 Z" fill={`url(#wing-${id})`} stroke={p.dark} strokeWidth={1.5} />
      <path d="M200,116 L240,112 L262,132 L222,134 Z" fill={p.dark} opacity={0.7} />
      <path d="M262,126 L292,108 L300,112 L284,140 Z" fill={`url(#wing-${id})`} stroke={p.dark} strokeWidth={1.2} />
      <Missile x={150} y={130} len={56} tip={p.tip} id={id} />
      <Missile x={172} y={143} len={56} tip={p.tip} id={id} />
      <Missile x={196} y={156} len={54} tip={p.tip} id={id} />

      {/* Lights */}
      <rect x="120" y="116" width="10" height="4" rx="2" fill="#fdba74" />
      <rect x="92" y="114" width="7" height="3" rx="1.5" fill="#fdba74" />
      <circle cx="58" cy="100" r="2" fill="#fde68a" />
    </svg>
  );
}
