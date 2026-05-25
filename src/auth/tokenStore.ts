export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const KEY = 'vv.tokens';
type Listener = (tokens: Tokens | null) => void;
const listeners = new Set<Listener>();

function notify(tokens: Tokens | null) {
  for (const listener of listeners) listener(tokens);
}

export const tokenStore = {
  get(): Tokens | null {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Tokens;
    } catch {
      return null;
    }
  },
  set(tokens: Tokens): void {
    sessionStorage.setItem(KEY, JSON.stringify(tokens));
    notify(tokens);
  },
  clear(): void {
    sessionStorage.removeItem(KEY);
    notify(null);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
