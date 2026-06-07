import Link from "next/link";

const appHref = "/app" as never;
const privacyHref = "/privacy" as never;
const termsHref = "/terms" as never;

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <span className="landing-footer-logo">Pilot</span>
            <p className="landing-footer-tagline">AI agents that run marketing campaigns.</p>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <span className="landing-footer-col-title">Product</span>
              <Link href={appHref} className="landing-footer-link">Open App</Link>
              <a href="#features" className="landing-footer-link">Features</a>
              <a href="#faq" className="landing-footer-link">FAQ</a>
            </div>
            <div className="landing-footer-col">
              <span className="landing-footer-col-title">Legal</span>
              <Link href={privacyHref} className="landing-footer-link">Privacy Policy</Link>
              <Link href={termsHref} className="landing-footer-link">Terms of Use</Link>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Pilot. All rights reserved.</span>
          <span>Built with Next.js, TypeScript, and Claude.</span>
        </div>
      </div>
    </footer>
  );
}
