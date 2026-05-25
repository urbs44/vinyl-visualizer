interface Props {
  className?: string;
}

export function SpotifyLogo({ className = 'h-6 w-auto' }: Props) {
  return (
    <img
      src="/spotify-full-logo-white.svg"
      alt="Spotify"
      className={className}
      draggable={false}
    />
  );
}
