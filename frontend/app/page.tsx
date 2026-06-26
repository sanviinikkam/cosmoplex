import { LanguageBar } from "@/components/landing/LanguageBar";
import { Hero } from "@/components/landing/Hero";
import { Agents } from "@/components/landing/Agents";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <LanguageBar />
      <Hero />
      <Agents />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </main>
  );
}
