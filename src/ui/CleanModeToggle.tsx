import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export function CleanModeToggle() {
  const toggleCleanMode = useUiStore(state => state.toggleCleanMode);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'f') toggleCleanMode();
    }
    window.addEventListener('keydown', onKey);

    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    function onPointerDown() {
      pressTimer = setTimeout(() => toggleCleanMode(), 1000);
    }
    function cancelPress() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', cancelPress);
    window.addEventListener('pointercancel', cancelPress);
    window.addEventListener('pointerleave', cancelPress);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', cancelPress);
      window.removeEventListener('pointercancel', cancelPress);
      window.removeEventListener('pointerleave', cancelPress);
    };
  }, [toggleCleanMode]);

  return null;
}
