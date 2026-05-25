import { useEffect, useRef, useState } from 'react';
import type { TurntableState } from '../playback/deriveTurntableState';
import { extractPalette, type Palette } from '../palette/extractPalette';
import { useSkin } from '../skins/useSkin';

interface Props {
  state: TurntableState;
  size?: number;
}

const RPM = 100 / 3;
const SPIN_DURATION_MS = 60_000 / RPM;

export function Vinyl({ state, size = 420 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const rateFrameRef = useRef<number | null>(null);
  const skin = useSkin();
  const [palette, setPalette] = useState<Palette | null>(null);

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
  }, [size, skin.label.ringColor, palette, state.transitionKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!animationRef.current) {
      animationRef.current = canvas.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        { duration: SPIN_DURATION_MS, iterations: Infinity, easing: 'linear' }
      );
      animationRef.current.playbackRate = 0;
    }

    const animation = animationRef.current;
    const targetRate = state.isPlaying && !prefersReducedMotion() ? 1 : 0;
    rateFrameRef.current = easePlaybackRate(animation, targetRate, 1500, rateFrameRef.current);

    return () => {
      if (rateFrameRef.current) cancelAnimationFrame(rateFrameRef.current);
    };
  }, [state.isPlaying, state.transitionKey]);

  useEffect(() => {
    const animation = animationRef.current;
    return () => {
      animation?.cancel();
    };
  }, []);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block', borderRadius: '50%' }}
      />
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

  context.fillStyle = ringColor;
  context.beginPath();
  context.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = palette?.dominant ?? '#777777';
  context.beginPath();
  context.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#000';
  context.beginPath();
  context.arc(cx, cy, radius * 0.025, 0, Math.PI * 2);
  context.fill();
}

function easePlaybackRate(
  animation: Animation,
  target: number,
  durationMs: number,
  existingFrame: number | null
): number {
  if (existingFrame) cancelAnimationFrame(existingFrame);
  const start = animation.playbackRate;
  const startTime = performance.now();
  let frame = 0;

  function step(now: number) {
    const t = Math.min(1, (now - startTime) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    animation.playbackRate = start + (target - start) * eased;
    if (t < 1) frame = requestAnimationFrame(step);
  }

  frame = requestAnimationFrame(step);
  return frame;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
