import Image from "next/image";
import Link from "next/link";

/** Logo icon + wordmark styled like the original logo: BATH in slate, RDV in blue. */
export function Logo({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="BATHRDV, accueil">
      <Image
        src="/logo-icon.png"
        alt=""
        width={821}
        height={481}
        priority
        className={big ? "h-12 w-auto" : "h-8 w-auto"}
      />
      <Wordmark className={big ? "text-3xl" : "text-xl"} />
    </Link>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-black italic tracking-tight ${className}`}>
      <span className="text-slate">BATH</span>
      <span className="bg-gradient-to-r from-blue to-blue-bright bg-clip-text text-transparent">RDV</span>
    </span>
  );
}

/** The blue swoosh under the logo, reused as the brand signature. */
export function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 24" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="swoosh" x1="0" x2="1">
          <stop offset="0" stopColor="var(--slate)" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="var(--blue-bright)" />
          <stop offset="1" stopColor="var(--blue)" />
        </linearGradient>
      </defs>
      <path d="M2 22C90 6 250 0 398 10C260 6 120 10 2 22Z" fill="url(#swoosh)" />
    </svg>
  );
}
