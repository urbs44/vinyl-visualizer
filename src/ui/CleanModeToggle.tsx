import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';

export function CleanModeToggle() {
  const toggleCleanMode = useUiStore(state => state.toggleCleanMode);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'f') toggleCleanMode();
    }
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [toggleCleanMode]);

  return null;
}

interface SurfaceProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function CleanModeSurface({ children, className, style }: SurfaceProps) {
  const toggleCleanMode = useUiStore(state => state.toggleCleanMode);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelPress() {
    if (!pressTimer.current) return;
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      event.target instanceof Element &&
      event.target.closest('a, button, input, select, textarea, [role="button"]')
    ) {
      return;
    }

    cancelPress();
    pressTimer.current = setTimeout(() => {
      toggleCleanMode();
      pressTimer.current = null;
    }, 1000);
  }

  useEffect(() => cancelPress, []);

  return (
    <div
      className={className}
      style={style}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onPointerLeave={cancelPress}
    >
      {children}
    </div>
  );
}
