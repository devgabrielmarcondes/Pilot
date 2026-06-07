import { LandingHero } from "@/components/landing-hero";
import { LandingAgents } from "@/components/landing-agents";
import { LandingFaq } from "@/components/landing-faq";

export default function LandingPage() {
  return (
    <main className="landing-main">
      <LandingHero />
      <LandingAgents />
      <LandingFaq />
    </main>
  );
}
