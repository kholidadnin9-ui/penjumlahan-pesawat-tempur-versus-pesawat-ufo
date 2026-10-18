import { useId } from 'react';
import { UFO_VB_H, UFO_VB_W } from '../game/ufo';

const OUT = '#0b1d4d';

function Porthole({ cx, cy, r, id, delay }: { cx: number; cy: number; r: number; id: string; delay: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 6} fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" />
      <circle cx={cx} cy={cy} r={r - 4} fill="#ffd21f" stroke="#ff9d00" strokeWidth="5" />
      <circle className={`ufo-blink-${id}`} style={{ animationDelay: `${delay}s` }} cx={cx} cy={cy} r={r - 14} fill={`url(#glow-${id})`} />
    </g>
  );
}

export default function Ufo({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox={`0 0 ${UFO_VB_W} ${UFO_VB_H}`} className={className} style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={`blue-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fd3ff" />
          <stop offset="0.5" stopColor="#1f93f5" />
          <stop offset="1" stopColor="#0d5fd8" />
        </linearGradient>
        <linearGradient id={`white-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e3e8ef" />
          <stop offset="1" stopColor="#a9b2bf" />
        </linearGradient>
        <linearGradient id={`gray-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7ced8" />
          <stop offset="0.5" stopColor="#f4f6f9" />
          <stop offset="1" stopColor="#9aa4b2" />
        </linearGradient>
        <linearGradient id={`yellow-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff36b" />
          <stop offset="0.5" stopColor="#ffc800" />
          <stop offset="1" stopColor="#ff9300" />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#a9efff" />
          <stop offset="0.45" stopColor="#4cbcfa" />
          <stop offset="1" stopColor="#2a8fe6" />
        </linearGradient>
        <linearGradient id={`inside-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f7fb0" />
          <stop offset="1" stopColor="#2a4a7a" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#fff59a" />
          <stop offset="0.75" stopColor="#ffbd00" />
          <stop offset="1" stopColor="#ff8a00" />
        </radialGradient>
        <linearGradient id={`flame-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#ffe44d" />
          <stop offset="0.7" stopColor="#ff9d00" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
        </linearGradient>
        <filter id={`blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <style>{`
        .ufo-flame-${id} { transform-box: fill-box; transform-origin: left center; animation: ufoFlame-${id} .14s ease-in-out infinite alternate; }
        @keyframes ufoFlame-${id} { from { transform: scaleX(.75); opacity: .8; } to { transform: scaleX(1.25); opacity: 1; } }
        .ufo-glow-${id} { transform-box: fill-box; transform-origin: center; animation: ufoGlow-${id} .8s ease-in-out infinite alternate; }
        @keyframes ufoGlow-${id} { from { opacity: .8; transform: scale(.93); } to { opacity: 1; transform: scale(1.06); } }
        .ufo-blink-${id} { animation: ufoBlink-${id} 1.3s ease-in-out infinite; }
        @keyframes ufoBlink-${id} { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
      `}</style>

      {/* ===== Engine flames (behind) ===== */}
      <g filter={`url(#blur-${id})`} opacity={0.75}>
        <ellipse cx="1560" cy="438" rx="90" ry="46" fill="#ffb400" />
        <ellipse cx="1550" cy="642" rx="90" ry="46" fill="#ffb400" />
      </g>
      <path className={`ufo-flame-${id}`} d="M1500,395 Q1620,360 1760,438 Q1620,515 1500,480 Z" fill={`url(#flame-${id})`} />
      <path className={`ufo-flame-${id}`} d="M1490,600 Q1610,565 1740,642 Q1610,718 1490,684 Z" fill={`url(#flame-${id})`} />

      {/* ===== Top tail fin ===== */}
      <path d="M1068,222 C1130,165 1230,122 1290,112 L1388,100 C1378,160 1352,230 1305,300 L1160,305 C1130,270 1100,245 1068,222 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M1292,112 L1388,100 C1380,165 1350,235 1302,302 L1235,300 C1272,235 1292,175 1292,112 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <ellipse cx="1207" cy="235" rx="34" ry="44" fill="#ffd21f" stroke={OUT} strokeWidth="6" />
      <ellipse className={`ufo-glow-${id}`} cx="1207" cy="235" rx="22" ry="31" fill={`url(#glow-${id})`} />

      {/* ===== Top yellow bumps ===== */}
      <path d="M866,165 C895,138 992,125 1030,180 L1030,198 C985,178 925,172 880,182 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M1034,246 C1060,234 1102,240 1114,258 C1086,270 1055,264 1034,246 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="6" strokeLinejoin="round" />

      {/* ===== Upper engine ===== */}
      <path d="M1150,325 C1200,308 1290,312 1345,330 L1345,545 C1290,548 1210,522 1170,502 C1148,450 1140,380 1150,325 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M1158,322 C1190,314 1218,320 1232,332 L1252,478 C1215,462 1188,438 1170,422 C1154,392 1150,350 1158,322 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
      <rect x="1285" y="328" width="96" height="222" rx="32" fill={`url(#gray-${id})`} stroke={OUT} strokeWidth="7" />
      <rect x="1346" y="332" width="64" height="214" rx="28" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" />
      <rect x="1388" y="342" width="42" height="194" rx="20" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" />
      <ellipse cx="1448" cy="438" rx="70" ry="98" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" />
      <ellipse className={`ufo-glow-${id}`} cx="1452" cy="438" rx="54" ry="80" fill={`url(#glow-${id})`} />

      {/* ===== Lower engine ===== */}
      <path d="M1170,492 C1230,480 1300,490 1345,506 L1345,772 C1290,778 1232,762 1196,742 C1170,682 1160,562 1170,492 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <rect x="1210" y="498" width="96" height="286" rx="36" fill={`url(#gray-${id})`} stroke={OUT} strokeWidth="7" />
      <rect x="1275" y="508" width="70" height="268" rx="32" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" />
      <rect x="1334" y="520" width="50" height="244" rx="24" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" />
      <ellipse cx="1432" cy="642" rx="70" ry="96" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" />
      <ellipse className={`ufo-glow-${id}`} cx="1436" cy="642" rx="54" ry="78" fill={`url(#glow-${id})`} />

      {/* ===== Lower tail fin ===== */}
      <path d="M1000,805 C1085,830 1195,842 1235,808 L1328,925 C1330,938 1300,946 1262,944 C1150,938 1050,890 1000,805 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M1030,818 C1100,845 1180,852 1225,825 L1290,915 C1190,915 1090,880 1030,818 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
      <ellipse cx="1165" cy="872" rx="50" ry="24" transform="rotate(18 1165 872)" fill="#ffd21f" stroke={OUT} strokeWidth="5" />
      <ellipse className={`ufo-glow-${id}`} cx="1165" cy="872" rx="36" ry="15" transform="rotate(18 1165 872)" fill={`url(#glow-${id})`} />

      {/* ===== Cabin back (behind dome) ===== */}
      <path d="M905,200 C990,230 1075,270 1150,310 L1180,478 L960,444 Z" fill={`url(#white-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M990,285 C1030,300 1090,325 1112,352 L1106,370 C1060,362 1010,346 990,330 Z" fill="#8a93a2" stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
      <path d="M1018,300 L1038,330" stroke={OUT} strokeWidth="9" strokeLinecap="round" />
      <path d="M1045,310 L1066,340" stroke={OUT} strokeWidth="9" strokeLinecap="round" />
      <path d="M1073,322 L1092,350" stroke={OUT} strokeWidth="9" strokeLinecap="round" />

      {/* ===== Main hull ===== */}
      <path
        d="M30,548 C32,510 110,452 265,398 C330,375 420,395 520,420 C700,455 880,455 1000,440 C1090,440 1160,465 1190,500 L1250,745 C1200,790 1080,835 930,842 C730,850 520,820 340,752 C210,705 100,655 45,600 C32,585 28,565 30,548 Z"
        fill={`url(#white-${id})`}
        stroke={OUT}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      {/* belly panel */}
      <path d="M470,742 C560,765 700,745 785,718 L835,765 C775,805 645,820 560,808 Z" fill="#a9b2bf" stroke={OUT} strokeWidth="5" strokeLinejoin="round" opacity={0.9} />
      {/* panel seams */}
      <path d="M735,520 C760,545 765,580 762,600" fill="none" stroke="#9aa4b2" strokeWidth="6" strokeLinecap="round" />
      <path d="M870,545 C895,570 900,600 898,620" fill="none" stroke="#9aa4b2" strokeWidth="6" strokeLinecap="round" />

      {/* blue band */}
      <path d="M262,495 C450,505 760,540 1010,590 L1160,625 L1165,668 C1100,672 1040,656 990,650 C860,656 740,718 600,715 C480,712 380,700 275,692 C240,640 234,560 262,495 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M300,468 C500,480 650,510 745,526 L745,542 C600,526 450,500 300,490 Z" fill="#ffffff" opacity={0.65} />
      <path d="M330,515 C520,525 720,552 900,585" fill="none" stroke="#bfe8ff" strokeWidth="9" strokeLinecap="round" opacity={0.6} />

      {/* portholes */}
      <Porthole cx={355} cy={603} r={54} id={id} delay={0} />
      <Porthole cx={510} cy={632} r={52} id={id} delay={0.25} />
      <Porthole cx={662} cy={655} r={50} id={id} delay={0.5} />

      {/* yellow slots on belly */}
      <rect x="300" y="696" width="172" height="36" rx="18" transform="rotate(12 386 714)" fill="#ffcf1f" stroke="#ff9300" strokeWidth="4" />
      <rect className={`ufo-blink-${id}`} x="312" y="703" width="148" height="20" rx="10" transform="rotate(12 386 714)" fill="#ffe66b" />
      <path d="M622,778 L784,770 L758,802 L640,804 Z" fill="#ffcf1f" stroke="#ff9300" strokeWidth="4" strokeLinejoin="round" />

      {/* side vents */}
      <rect x="1050" y="578" width="98" height="26" rx="13" fill="#3a4254" stroke={OUT} strokeWidth="4" />
      <rect x="1066" y="616" width="82" height="24" rx="12" fill="#3a4254" stroke={OUT} strokeWidth="4" />

      {/* ===== Nose cone ===== */}
      <path d="M30,545 C45,505 100,470 140,455 L212,446 C256,500 264,590 248,662 L150,674 C90,652 40,602 30,545 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M118,448 C210,440 275,500 278,570 C280,640 230,685 200,690 L150,672 C195,630 205,570 195,520 C185,490 150,462 118,448 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <ellipse cx="68" cy="540" rx="44" ry="64" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" />
      <ellipse className={`ufo-glow-${id}`} cx="70" cy="540" rx="30" ry="46" fill={`url(#glow-${id})`} />
      <ellipse cx="62" cy="514" rx="11" ry="16" fill="#ffffff" opacity={0.85} />

      {/* ===== Glass dome ===== */}
      <path d="M340,382 C350,265 470,138 685,136 C790,136 860,165 912,205 C950,240 962,300 962,350 C962,385 950,410 940,420 C760,455 520,440 340,400 Z" fill={`url(#glass-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      {/* dark interior strip */}
      <path d="M362,378 C520,352 780,352 950,404 C942,418 934,426 926,430 C760,456 520,446 346,400 Z" fill={`url(#inside-${id})`} opacity={0.9} />
      <ellipse className={`ufo-blink-${id}`} cx="468" cy="396" rx="34" ry="9" fill="#ffb347" />
      {/* highlights */}
      <path d="M480,258 C500,208 570,176 622,172 C590,200 540,236 520,268 C505,278 485,272 480,258 Z" fill="#ffffff" opacity={0.8} />
      <path d="M420,302 C430,272 450,256 466,250 C462,282 450,312 430,326 C418,326 414,314 420,302 Z" fill="#ffffff" opacity={0.7} />
      <ellipse cx="886" cy="360" rx="14" ry="32" fill="#ffffff" opacity={0.85} />
      <ellipse cx="900" cy="402" rx="12" ry="10" fill="#ffffff" opacity={0.85} />
      {/* right gray frame */}
      <path d="M818,150 C900,170 975,250 1000,330 L1010,425 L945,428 C968,380 966,300 930,236 C905,196 860,166 818,150 Z" fill={`url(#gray-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />

      {/* dome base ring */}
      <path d="M255,422 C300,368 420,380 640,390 L955,426 C1010,446 1030,474 1000,482 C800,505 500,484 330,474 C270,464 245,442 255,422 Z" fill={`url(#gray-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" opacity={0.98} />
      <path d="M290,448 C420,460 700,478 980,462" fill="none" stroke="#8892a2" strokeWidth="6" strokeLinecap="round" />
      <ellipse className={`ufo-blink-${id}`} cx="322" cy="432" rx="34" ry="17" transform="rotate(14 322 432)" fill="#ffb02e" stroke="#ff7a00" strokeWidth="4" />
      <ellipse className={`ufo-blink-${id}`} style={{ animationDelay: '.5s' }} cx="868" cy="470" rx="48" ry="17" fill="#ffb02e" stroke="#ff7a00" strokeWidth="4" />

      {/* ===== Front lower wing ===== */}
      <path d="M735,672 C805,628 935,608 1022,625 C1115,650 1175,735 1222,805 C1222,820 1195,828 1160,826 L915,816 C860,790 800,730 735,672 Z" fill={`url(#yellow-${id})`} stroke={OUT} strokeWidth="7" strokeLinejoin="round" />
      <path d="M768,682 C835,650 935,632 1008,644 C1085,665 1140,735 1182,792 L905,790 C850,770 805,725 768,682 Z" fill={`url(#blue-${id})`} stroke={OUT} strokeWidth="6" strokeLinejoin="round" />
      <path d="M830,672 C880,655 940,650 978,656 L880,692 Z" fill="#ffffff" opacity={0.55} />
      <ellipse cx="975" cy="726" rx="64" ry="27" transform="rotate(8 975 726)" fill="#ffd21f" stroke={OUT} strokeWidth="5" />
      <ellipse className={`ufo-glow-${id}`} cx="975" cy="726" rx="46" ry="16" transform="rotate(8 975 726)" fill={`url(#glow-${id})`} />
    </svg>
  );
}
