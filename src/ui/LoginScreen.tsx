import { useAuth } from '../auth/useAuth';

export function LoginScreen() {
  const { login } = useAuth();
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-black text-white">
      <h1 className="text-4xl font-light tracking-wide">VinylVision</h1>
      <p className="text-white/60 text-sm">Your Spotify, as a record player.</p>
      <button
        onClick={() => login()}
        className="px-6 py-3 rounded-full bg-[#1ED760] hover:bg-[#1ed760] text-black font-semibold"
      >
        Connect Spotify
      </button>
      <p className="text-white/40 text-xs max-w-sm text-center">
        Requires a Spotify Premium account authorized for this app (Development Mode).
      </p>
    </div>
  );
}
