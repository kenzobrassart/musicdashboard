// Mark : trois barres d'égaliseur (musique) traversées par une courbe ascendante (compta/croissance).
export default function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32" fill="none"
      className={className} role="img" aria-label="Studio Ops"
    >
      <rect width="32" height="32" rx="9" className="fill-brand/15" />
      <rect x="7" y="18" width="3.2" height="7" rx="1.4" className="fill-brand" />
      <rect x="12.4" y="13" width="3.2" height="12" rx="1.4" className="fill-brand" opacity="0.85" />
      <rect x="17.8" y="16" width="3.2" height="9" rx="1.4" className="fill-brand" opacity="0.7" />
      <path
        d="M6.5 11 L13 6.5 L18 9 L25.5 4"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        className="text-text-primary"
      />
      <path
        d="M20.5 4 L25.5 4 L25.5 8.5"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        className="text-text-primary"
      />
    </svg>
  )
}
