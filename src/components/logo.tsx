import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="Portoferry, beranda">
      <svg width="30" height="35" viewBox="0 0 30 35" fill="none" aria-hidden="true">
        <path d="M5 28V8L25 3V10L12 13V17L23 14V21L12 24V32L5 34V28Z" fill="currentColor" />
        <path d="M1 4L5 3V8L1 9V4Z" fill="#afd9f2" />
      </svg>
      {!compact && <span>porto<span className="logo-light">ferry</span><span className="accent">.</span></span>}
    </Link>
  );
}
