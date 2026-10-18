import { useMemo } from 'react';

export default function Explosion({ x, y, size }: { x: number; y: number; size: number }) {
  const debris = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
        const dist = size * (0.8 + Math.random() * 0.9);
        return {
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          s: 6 + Math.random() * 12,
          c: ['#fde047', '#fb923c', '#ef4444', '#78716c', '#44403c'][i % 5],
          d: Math.random() * 120,
        };
      }),
    [size]
  );
  return (
    <div className="pointer-events-none absolute z-30" style={{ left: x, top: y }}>
      <div className="boom-flash absolute rounded-full" style={{ width: size * 1.4, height: size * 1.4, background: 'radial-gradient(circle, #fff 0%, #fef08a 25%, #fb923c 50%, #ef4444 70%, transparent 75%)' }} />
      <div className="boom-ring absolute rounded-full border-orange-300" style={{ width: size, height: size, borderStyle: 'solid' }} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="smoke absolute rounded-full"
          style={{
            width: size * 0.8, height: size * 0.8, left: (i - 1) * size * 0.3,
            background: 'radial-gradient(circle, rgba(60,50,45,.8), transparent 70%)',
            animationDelay: `${200 + i * 100}ms`, opacity: 0,
          }}
        />
      ))}
      {debris.map((d, i) => (
        <span
          key={i}
          className="debris absolute"
          style={{
            width: d.s, height: d.s, background: d.c,
            borderRadius: i % 2 ? '50%' : '30% 70% 40% 60%',
            boxShadow: i % 5 < 3 ? `0 0 8px ${d.c}` : 'none',
            ['--dx' as string]: `${d.dx}px`, ['--dy' as string]: `${d.dy}px`,
            animationDelay: `${d.d}ms`,
          }}
        />
      ))}
    </div>
  );
}
