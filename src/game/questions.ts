export type Question = { a: number; b: number; answer: number; options: number[] };

export const LEVELS = [
  { id: 1, name: 'Level 1', title: 'Sabuk Asteroid', desc: 'Puluhan + satuan (tanpa menyimpan)', example: '23 + 4' },
  { id: 2, name: 'Level 2', title: 'Nebula Ungu', desc: 'Puluhan + puluhan (tanpa menyimpan)', example: '32 + 45' },
  { id: 3, name: 'Level 3', title: 'Cincin Saturnus', desc: 'Puluhan + satuan (dengan menyimpan)', example: '38 + 5' },
  { id: 4, name: 'Level 4', title: 'Badai Bintang', desc: 'Puluhan + puluhan (dengan menyimpan)', example: '47 + 36' },
  { id: 5, name: 'Level 5', title: 'Lubang Hitam', desc: 'Campuran semua, hasil sampai 100', example: '56 + 44' },
];

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function pair(level: number): [number, number] {
  switch (level) {
    case 1: {
      const t = rnd(1, 9), o = rnd(0, 8);
      return [t * 10 + o, rnd(1, 9 - o)];
    }
    case 2: {
      const at = rnd(1, 8), ao = rnd(0, 9);
      const bt = rnd(1, 9 - at), bo = rnd(0, 9 - ao);
      return [at * 10 + ao, bt * 10 + bo];
    }
    case 3: {
      const t = rnd(1, 8), o = rnd(2, 9);
      return [t * 10 + o, rnd(10 - o, 9)];
    }
    case 4: {
      const at = rnd(1, 7), ao = rnd(1, 9);
      const bt = rnd(1, 8 - at), bo = rnd(10 - ao, 9);
      return [at * 10 + ao, bt * 10 + bo];
    }
    default: {
      const r = Math.random();
      if (r < 0.2) {
        const a = rnd(11, 89);
        return [a, 100 - a];
      }
      return pair(rnd(1, 4));
    }
  }
}

function makeOptions(ans: number, a: number, b: number): number[] {
  const carry = (a % 10) + (b % 10) >= 10;
  const prefer = carry ? [ans - 10, ans + 1, ans - 1] : [ans + 10, ans - 1, ans + 1];
  const others = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 11, ans - 9];
  const valid = (n: number) => n >= 1 && n <= 100 && n !== ans;
  const picks: number[] = [];
  const first = prefer.filter(valid);
  if (first.length && Math.random() < 0.75) picks.push(first[0]);
  for (const n of shuffle(others)) {
    if (picks.length >= 2) break;
    if (valid(n) && !picks.includes(n)) picks.push(n);
  }
  return shuffle([ans, ...picks]);
}

export function generateQuestions(level: number, count = 10): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < 500) {
    const [a, b] = pair(level);
    const key = `${a}+${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const answer = a + b;
    out.push({ a, b, answer, options: makeOptions(answer, a, b) });
  }
  return out;
}
