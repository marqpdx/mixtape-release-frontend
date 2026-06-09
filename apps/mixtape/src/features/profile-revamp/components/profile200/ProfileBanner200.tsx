'use client';

import { useMemo } from 'react';
import Image from 'next/image';

type PaletteName = 'Bauhaus' | 'Sage' | 'Clay';

interface Palette {
  bg: string;
  base: string[];
  pop: string[];
  sun: string;
}

const PALETTES: Record<PaletteName, Palette> = {
  Bauhaus: {
    bg:   '#efe7cf',
    base: ['#efe7cf', '#8f9794', '#f7f6f0', '#b9bfba'],
    pop:  ['#f1c40f', '#a9722e', '#34403a', '#d98a2b'],
    sun:  '#f1c40f',
  },
  Sage: {
    bg:   '#e7ead6',
    base: ['#e7ead6', '#b8c39a', '#f3f4ea', '#9aa87f'],
    pop:  ['#c9a14a', '#7a8c5f', '#4d5a45', '#d6b35e'],
    sun:  '#d6b35e',
  },
  Clay: {
    bg:   '#efd9c3',
    base: ['#efd9c3', '#d9c4ac', '#f4ece2', '#c9b39c'],
    pop:  ['#c0673a', '#e0a878', '#8a5a3a', '#3a322c'],
    sun:  '#e0a878',
  },
};

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildCells(paletteName: PaletteName, cols: number) {
  const pal = PALETTES[paletteName];
  const S = 100;
  const rows = 5;
  const rnd = mulberry32(hashStr(paletteName + ':' + cols));
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)];
  const cells: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * S;
      const y = r * S;
      const t = rnd();
      const base = pick(pal.base);
      const pop  = pick(pal.pop);

      if (t < 0.34) {
        const flip = rnd() < 0.5;
        const a = flip
          ? `${x},${y} ${x+S},${y} ${x},${y+S}`
          : `${x+S},${y} ${x+S},${y+S} ${x},${y}`;
        const b = flip
          ? `${x+S},${y} ${x+S},${y+S} ${x},${y+S}`
          : `${x},${y} ${x},${y+S} ${x+S},${y+S}`;
        cells.push(
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width={S} height={S} fill={base} />
            <polygon points={a} fill={pop} />
            <polygon points={b} fill={pick(pal.base)} />
          </g>
        );
      } else if (t < 0.52) {
        cells.push(
          <rect key={`${r}-${c}`} x={x} y={y} width={S} height={S} fill={rnd() < 0.45 ? pop : base} />
        );
      } else if (t < 0.7) {
        cells.push(
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width={S} height={S} fill={base} />
            <circle cx={x + S/2} cy={y + S/2} r={S * 0.42} fill={pop} />
          </g>
        );
      } else if (t < 0.86) {
        const corners = [
          `M ${x},${y} L ${x+S},${y} A ${S} ${S} 0 0 1 ${x},${y+S} Z`,
          `M ${x+S},${y} L ${x+S},${y+S} A ${S} ${S} 0 0 1 ${x},${y} Z`,
          `M ${x+S},${y+S} L ${x},${y+S} A ${S} ${S} 0 0 1 ${x+S},${y} Z`,
          `M ${x},${y+S} L ${x},${y} A ${S} ${S} 0 0 1 ${x+S},${y+S} Z`,
        ];
        cells.push(
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width={S} height={S} fill={base} />
            <path d={pick(corners)} fill={pop} />
          </g>
        );
      } else {
        const tris = [
          `${x},${y} ${x+S},${y} ${x+S/2},${y+S}`,
          `${x},${y+S} ${x+S},${y+S} ${x+S/2},${y}`,
          `${x},${y} ${x},${y+S} ${x+S},${y+S/2}`,
          `${x+S},${y} ${x+S},${y+S} ${x},${y+S/2}`,
        ];
        cells.push(
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width={S} height={S} fill={base} />
            <polygon points={pick(tris)} fill={pop} />
          </g>
        );
      }
    }
  }

  // signature sun
  const sunC = 1 + Math.floor(rnd() * (cols - 2));
  const sunR = 1 + Math.floor(rnd() * (rows - 2));
  cells.push(
    <circle key="sun" cx={sunC * S + S/2} cy={sunR * S + S/2} r={S * 0.6} fill={pal.sun} />
  );

  return { pal, cols, rows, S, cells };
}

interface ProfileBanner200Props {
  backgroundImageUrl: string | null;
  palette?: PaletteName;
  cols?: number;
}

export function ProfileBanner200({ backgroundImageUrl, palette = 'Bauhaus', cols = 20 }: ProfileBanner200Props) {
  const { pal, rows, S, cells } = useMemo(() => buildCells(palette, cols), [palette, cols]);

  return (
    <div className="p200-banner-root">
      <div style={{ height: 196, overflow: 'hidden', background: '#edefe3', position: 'relative' }}>
        {backgroundImageUrl ? (
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            style={{ objectFit: 'cover' }}
            sizes="100vw"
            priority
          />
        ) : (
          <svg
            viewBox={`0 0 ${cols * S} ${rows * S}`}
            preserveAspectRatio="xMidYMid slice"
            width="100%"
            height="100%"
            role="img"
            aria-label="Decorative geometric banner"
          >
            <rect x="0" y="0" width={cols * S} height={rows * S} fill={pal.bg} />
            {cells}
          </svg>
        )}
      </div>
      {/* 3px accent rule */}
      <div style={{ height: 3, background: 'var(--accent)' }} />
    </div>
  );
}
