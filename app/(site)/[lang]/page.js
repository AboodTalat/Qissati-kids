import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import HowItWorks from "@/components/HowItWorks";
import Tiers from "@/components/Tiers";
import SamplePreview from "@/components/SamplePreview";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import { getDictionary } from "@/lib/i18n";
import { getPricing } from "@/lib/pricing";
import { landingStructuredData, serializeJsonLd } from "@/lib/seo";

// Sections take their copy as a prop rather than reaching for a global. That
// keeps every one of them a pure server component and makes the locale an
// explicit argument at each boundary — including the handful of client
// components below, which receive already-resolved strings.
export default async function Home({ params }) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  // Prices, turnaround and the age range, served by the admin dashboard. The
  // fetch fails soft to an all-`null` table, so an unreachable API renders the
  // `[X]` placeholders this page has always shown rather than breaking it.
  const pricing = await getPricing();
  const structuredData = landingStructuredData({ dict, lang, pricing });

  return (
    <>
      <script type="application/ld+json">
        {serializeJsonLd(structuredData)}
      </script>
      <Header lang={lang} dict={dict} onLanding />
      <main className="flex-1">
        <Hero dict={dict} lang={lang} />
        <TrustBar dict={dict} />
        <HowItWorks dict={dict} />
        <Tiers dict={dict} lang={lang} />
        <SamplePreview dict={dict} />
        <Pricing dict={dict} lang={lang} pricing={pricing} />
        <Faq dict={dict} pricing={pricing} />
        <FinalCta dict={dict} />
      </main>
      <Footer dict={dict} />
    </>
  );
}
