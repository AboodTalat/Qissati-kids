import { Cairo } from "next/font/google";
import { LOCALES, dirOf, getDictionary } from "@/lib/i18n";
import "../../globals.css";

// This IS the root layout — there is no app/layout.js, because <html lang>
// and <html dir> both depend on the [lang] segment and only a layout inside
// that segment can read it. `/` redirects here via next.config.mjs.

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Without this, /fr would render the Arabic dictionary under lang="fr"
// instead of 404ing.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { meta } = getDictionary(lang);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: meta.ogTitle,
      description: meta.ogDescription,
      locale: meta.ogLocale,
      type: "website",
    },
  };
}

export const viewport = {
  themeColor: "#1f8a8c",
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;

  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      className={`${cairo.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
