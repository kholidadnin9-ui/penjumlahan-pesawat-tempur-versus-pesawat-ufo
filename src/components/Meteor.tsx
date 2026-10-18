type Props = {
  value: number;
  size: number;
  state: 'idle' | 'burn' | 'wrong' | 'correct-hint' | 'dim';
  onClick?: () => void;
  keyHint?: string;
  delay?: number;
};

export default function Meteor({ value, size, state, onClick, keyHint, delay = 0 }: Props) {
  const fontSize = size * 0.36;
  return (
    <div className="meteor-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="meteor-bob" style={{ animationDelay: `${delay * 2}ms` }}>
        <button
          onClick={onClick}
          className={`relative block cursor-pointer outline-none ${state === 'burn' ? 'meteor-burn' : ''} ${state === 'wrong' ? 'meteor-wrong' : ''}`}
          style={{ width: size, height: size, opacity: state === 'dim' ? 0.45 : 1, transition: 'opacity .3s' }}
          aria-label={`Jawaban ${value}`}
        >
          {/* Fire tail (meteor flying left, trail toward the right) */}
          <div
            className="meteor-tail absolute pointer-events-none"
            style={{
              left: size * 0.5,
              top: '50%',
              width: size * 1.3,
              height: size * 0.75,
              borderRadius: '0 50% 50% 0 / 0 50% 50% 0',
              background: 'radial-gradient(ellipse at 0% 50%, rgba(255,240,180,.95) 0%, rgba(251,146,60,.8) 30%, rgba(239,68,68,.4) 60%, transparent 75%)',
              filter: 'blur(4px)',
            }}
          />
          {/* Rock */}
          <div
            className={`absolute inset-0 rounded-full ${state === 'correct-hint' ? 'correct-glow' : ''}`}
            style={{
              background: 'radial-gradient(circle at 35% 30%, #a8a29e 0%, #78716c 30%, #44403c 70%, #1c1917 100%)',
              boxShadow: 'inset -8px -10px 18px rgba(0,0,0,.6), inset 6px 6px 12px rgba(255,255,255,.15), 0 0 20px rgba(251,146,60,.6)',
              borderRadius: '48% 52% 45% 55% / 52% 46% 54% 48%',
            }}
          >
            <div className="meteor-rot absolute inset-0">
              {[
                [22, 25, 18], [60, 20, 13], [65, 62, 20], [25, 65, 12], [45, 45, 8],
              ].map(([x, y, s], i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${x}%`, top: `${y}%`, width: `${s}%`, height: `${s}%`,
                    background: 'radial-gradient(circle at 60% 60%, #57534e, #292524)',
                    boxShadow: 'inset 2px 2px 3px rgba(0,0,0,.7)',
                  }}
                />
              ))}
            </div>
          </div>
          {/* Number */}
          <span
            className="font-orb absolute inset-0 flex items-center justify-center font-black"
            style={{ fontSize, color: state === 'wrong' ? '#fca5a5' : '#fff', textShadow: '0 0 6px #000, 0 2px 0 #000, 0 0 14px rgba(251,191,36,.9)' }}
          >
            {value}
          </span>
          {keyHint && (
            <span className="absolute -bottom-1 -left-1 rounded-md bg-black/70 px-1.5 text-xs font-bold text-cyan-300 border border-cyan-400/60">
              {keyHint}
            </span>
          )}
          {state === 'wrong' && (
            <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xl font-black border-2 border-white">✗</span>
          )}
        </button>
      </div>
    </div>
  );
}
