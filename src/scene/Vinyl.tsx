import { useEffect, useRef, useState } from 'react';
import type { TurntableState } from '../playback/deriveTurntableState';
import { extractPalette, type Palette } from '../palette/extractPalette';
import { useSkin } from '../skins/useSkin';
import { getVinylLabelColor } from './vinylColors';
import { getVinylAnimationState, VINYL_SPIN_DURATION_MS } from './vinylMotion';

interface Props {
  state: TurntableState;
  size?: number;
}

export function Vinyl({ state, size = 420 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skin = useSkin();
  const [palette, setPalette] = useState<Palette | null>(null);
  const [redrawTick, setRedrawTick] = useState(0);

  const artworkUrl = state.kind === 'track' || state.kind === 'episode' ? state.artworkUrl : null;

  useEffect(() => {
    let cancelled = false;
    void extractPalette(artworkUrl).then(nextPalette => {
      if (!cancelled) setPalette(nextPalette);
    });
    return () => {
      cancelled = true;
    };
  }, [artworkUrl]);

  useEffect(() => {
    function bump() {
      setRedrawTick(tick => tick + 1);
    }

    window.addEventListener('resize', bump);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', bump);
    let dprQuery: MediaQueryList | null = null;
    function onDprChange() {
      bump();
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    }
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDprChange);

    return () => {
      window.removeEventListener('resize', bump);
      motionQuery.removeEventListener('change', bump);
      dprQuery?.removeEventListener('change', onDprChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(dpr, 2, 1600 / size);
    canvas.width = size * scale;
    canvas.height = size * scale;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    drawVinyl(context, size, skin.label.ringColor, palette);
  }, [size, skin.label.ringColor, palette, state.transitionKey, redrawTick]);

  const animationPlayState = getVinylAnimationState({
    isPlaying: state.isPlaying,
    reducedMotion: prefersReducedMotion(),
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        data-testid="vinyl-disc"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          animation: `vinyl-spin ${VINYL_SPIN_DURATION_MS}ms linear infinite`,
          animationPlayState,
          transformOrigin: 'center center',
          willChange: animationPlayState === 'running' ? 'transform' : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, display: 'block', borderRadius: '50%' }}
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 30% at 40% 25%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
    </div>
  );
}

function drawVinyl(
  context: CanvasRenderingContext2D,
  size: number,
  ringColor: string,
  palette: Palette | null
) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  context.clearRect(0, 0, size, size);

  context.fillStyle = '#0a0a0a';
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(255,255,255,0.04)';
  context.lineWidth = 1;
  for (let grooveRadius = radius * 0.35; grooveRadius < radius * 0.97; grooveRadius += 2) {
    context.beginPath();
    context.arc(cx, cy, grooveRadius, 0, Math.PI * 2);
    context.stroke();
  }

  context.strokeStyle = 'rgba(255,255,255,0.12)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, radius * 0.72, -0.3, 0.18);
  context.stroke();

  context.fillStyle = ringColor;
  context.beginPath();
  context.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = getVinylLabelColor(palette, ringColor);
  context.beginPath();
  context.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(255,255,255,0.35)';
  context.beginPath();
  context.arc(cx + radius * 0.12, cy - radius * 0.08, radius * 0.02, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#000';
  context.beginPath();
  context.arc(cx, cy, radius * 0.025, 0, Math.PI * 2);
  context.fill();
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
