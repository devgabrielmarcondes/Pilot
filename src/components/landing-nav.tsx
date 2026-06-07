import Link from "next/link";

const appHref = "/app" as never;

export function LandingNav() {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-brand">
          <img src="/pilot-logo-white.png" alt="Pilot" width={64} height={64} />
        </Link>

        <div className="landing-nav-links">  
          <a href="#faq" className="landing-nav-link">FAQ</a>
          <Link href={appHref} className="landing-nav-cta">
            Open App
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
