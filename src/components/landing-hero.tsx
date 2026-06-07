import Link from "next/link";

const appHref = "/app" as never;

export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero-bg" />
      <div className="landing-hero-content">
        <div className="landing-hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          AI Marketing Platform
        </div>
        <h1 className="landing-hero-title">
          AI Agents That Run<br />Marketing <span className="landing-hero-title-muted">Campaigns</span>
        </h1>
        <p className="landing-hero-subtitle">
          Pilot is the AI agent platform that plans, launches,<br className="landing-hero-subtitle-br" />
          and optimizes marketing campaigns&mdash;autonomously.
        </p>
        <div className="landing-hero-actions">
          <Link href={appHref} className="landing-hero-btn-primary">
            Get started
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
