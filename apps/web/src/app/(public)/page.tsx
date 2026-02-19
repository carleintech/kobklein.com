import { WelcomeNav } from "@/components/welcome/nav";
import { WelcomeHero } from "@/components/welcome/hero";
import { FeaturesSection } from "@/components/welcome/features";
import { HowItWorksSection } from "@/components/welcome/how-it-works";
import { TestimonialsSection } from "@/components/welcome/testimonials";
import { SecuritySection } from "@/components/welcome/security";
import { CtaSection } from "@/components/welcome/cta";
import { FooterModern } from "@/components/welcome/FooterModern";

/**
 * Welcome / Landing Page — KobKlein fintech showcase.
 * Shown to unauthenticated visitors at "/".
 */
export default function WelcomePage() {
  return (
    <>
      <WelcomeNav />
      <WelcomeHero />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <SecuritySection />
      <CtaSection />
      <FooterModern />
    </>
  );
}
