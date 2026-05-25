interface Props {
  externalUrl: string | null;
}

export function SpotifyAttribution({ externalUrl }: Props) {
  const content = (
    <span className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white">
      <span className="h-2 w-2 rounded-full bg-[#1DB954]" aria-hidden />
      <span className="font-semibold">Listen on Spotify</span>
    </span>
  );

  if (!externalUrl) {
    return <div className="fixed bottom-3 right-3 z-50 opacity-80">{content}</div>;
  }

  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-3 right-3 z-50"
    >
      {content}
    </a>
  );
}
