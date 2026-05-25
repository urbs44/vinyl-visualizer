import { create } from 'zustand';
import { DEFAULT_SKIN_ID } from '../skins/skins';

interface UiState {
  skinId: string;
  cleanMode: boolean;
  setSkin: (id: string) => void;
  toggleCleanMode: () => void;
}

const SKIN_KEY = 'vv.skin';
const CLEAN_KEY = 'vv.cleanMode';

export const useUiStore = create<UiState>(set => ({
  skinId: localStorage.getItem(SKIN_KEY) ?? DEFAULT_SKIN_ID,
  cleanMode: localStorage.getItem(CLEAN_KEY) === '1',
  setSkin: id => {
    localStorage.setItem(SKIN_KEY, id);
    set({ skinId: id });
  },
  toggleCleanMode: () =>
    set(state => {
      const next = !state.cleanMode;
      localStorage.setItem(CLEAN_KEY, next ? '1' : '0');
      return { cleanMode: next };
    }),
}));
