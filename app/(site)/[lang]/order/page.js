import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderForm from "@/components/order/OrderForm";
import { LOCALES, getDictionary } from "@/lib/i18n";
import { getOrderPricing } from "@/lib/pricing";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { order } = getDictionary(lang);

  return {
    title: order.metaTitle,
    description: order.metaDescription,
    alternates: {
      canonical: `/${lang}/order`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}/order`])),
    },
    // The order page is a form, not a landing page — there is nothing here for
    // a search result to usefully show, and every variant is the same page.
    robots: { index: false, follow: true },
  };
}

// The tier/format preselection is read here rather than in the client with
// useSearchParams: that keeps the query out of the client entirely, so there
// is no hydration mismatch and no setState-in-effect for React Compiler to
// reject. The cost is that this route renders dynamically instead of being
// prerendered — fine for a noindex form.
const ALLOWED = {
  format: ["pdf", "print"],
};

const sanitise = (key, raw) => (ALLOWED[key].includes(raw) ? raw : "");

export default async function OrderPage({ params, searchParams }) {
  const { lang } = await params;
  const q = (await searchParams) ?? {};
  const dict = getDictionary(lang);
  // The live price table, or the all-`[X]` fallback when the API is down. The
  // parent's quote is computed again server-side when the order is filed, so
  // this is what they see, not what they are charged from.
  const pricing = await getOrderPricing();

  return (
    <>
      <Header lang={lang} dict={dict} />
      <main className="flex-1">
        <OrderForm
          dict={dict}
          lang={lang}
          initialFormat={sanitise("format", q.format)}
          pricing={pricing}
        />
      </main>
      <Footer dict={dict} />
    </>
  );
}
