import { useUiStore } from '../store/uiStore';
import { DEFAULT_SKIN_ID, SKINS } from './skins';
import type { Skin } from './types';

export function useSkin(): Skin {
  const skinId = useUiStore(state => state.skinId);
  return SKINS[skinId] ?? SKINS[DEFAULT_SKIN_ID];
}
