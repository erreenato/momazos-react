import type { CSSProperties } from 'react';
import { Portal } from '@mui/material';
import './RankingTransition.css';

export type RankingTransitionKind = 'lightning' | 'rainbow';

/** Duración total de la animación y momento en que se cambia la vista por debajo. */
export const TRANSITION_TOTAL_MS = 1300;
export const TRANSITION_SWAP_MS = 520;

/** Rayos: cada uno es una línea en zigzag dentro de un SVG de 100×100 que cubre la pantalla. */
const BOLTS = [
  { points: '58,0 50,20 60,22 44,48 56,50 38,78 47,80 36,100', delay: 0.08 },
  { points: '22,0 27,16 19,18 30,38 22,40 31,62', delay: 0.28 },
  { points: '84,0 78,14 86,17 72,40 81,42 70,66 76,68 68,86', delay: 0.42 },
];

/** Colores del arcoíris, del arco exterior al interior. */
const RAINBOW = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#0a84ff', '#5856d6', '#af52de'];

/** Destellos del arcoíris: posición (en % de pantalla) y retardo. */
const SPARKLES = [
  { left: 12, top: 30, delay: 0.25 },
  { left: 85, top: 26, delay: 0.35 },
  { left: 30, top: 14, delay: 0.5 },
  { left: 68, top: 12, delay: 0.42 },
  { left: 50, top: 70, delay: 0.6 },
  { left: 20, top: 62, delay: 0.7 },
  { left: 80, top: 58, delay: 0.55 },
];

/**
 * Capa a pantalla completa con la animación de cambio entre Ranking y Anti-Ranking.
 * - "lightning": tormenta con relámpagos (Ranking → Anti-Ranking).
 * - "rainbow": resplandor con arcoíris (Anti-Ranking → Ranking).
 * Se dibuja con un Portal de MUI directamente en <body>, sobre toda la app.
 */
export function RankingTransition({ kind }: { kind: RankingTransitionKind | null }) {
  if (!kind) return null;

  return (
    <Portal>
      <div className={`rt-overlay rt-${kind}`} aria-hidden="true">
        {kind === 'lightning' ? (
          <>
            <svg className="rt-bolts" viewBox="0 0 100 100" preserveAspectRatio="none">
              {BOLTS.map((bolt) => (
                <polyline
                  key={bolt.points}
                  className="rt-bolt"
                  points={bolt.points}
                  vectorEffect="non-scaling-stroke"
                  style={{ animationDelay: `${bolt.delay}s` }}
                />
              ))}
            </svg>
            <div className="rt-flash" />
          </>
        ) : (
          <>
            <div className="rt-glow" />
            <svg className="rt-arcs" viewBox="0 0 200 110">
              {RAINBOW.map((color, i) => {
                const r = 92 - i * 8;
                return (
                  <path
                    key={color}
                    className="rt-arc"
                    d={`M ${100 - r} 106 A ${r} ${r} 0 0 1 ${100 + r} 106`}
                    stroke={color}
                    pathLength={1}
                    style={{ animationDelay: `${0.05 + i * 0.05}s` }}
                  />
                );
              })}
            </svg>
            {SPARKLES.map((s) => (
              <span
                key={`${s.left}-${s.top}`}
                className="rt-sparkle"
                style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` } as CSSProperties}
              >
                ✦
              </span>
            ))}
          </>
        )}
      </div>
    </Portal>
  );
}
