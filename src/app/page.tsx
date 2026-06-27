import { Header } from "@/components/site/header";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { Hero } from "@/components/site/hero";
import { LogosStrip } from "@/components/site/logos-strip";
import { McpBridge } from "@/components/site/mcp-bridge";
import { HowItWorks } from "@/components/site/how-it-works";
import { UseCases } from "@/components/site/use-cases";
import { Features } from "@/components/site/features";
import { UnderTheHood } from "@/components/site/under-the-hood";
import { Security } from "@/components/site/security";
import { Screenshots } from "@/components/site/screenshots";
import { Pricing } from "@/components/site/pricing";
import { Install } from "@/components/site/install";
import { FAQ } from "@/components/site/faq";
import { FinalCTA } from "@/components/site/final-cta";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ScrollProgress />
      <Header />

      <main className="flex-1">
        <Hero />
        <LogosStrip />
        <McpBridge />
        <HowItWorks />
        <UseCases />
        <Features />
        <UnderTheHood />
        <Security />
        <Screenshots />
        <Pricing />
        <Install />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
