import { Cairo } from "next/font/google";
import "../../globals.css";

/**
 * The dashboard's own root layout.
 *
 * `app/(site)/[lang]/layout.js` is the site's root layout and it depends on
 * the `[lang]` segment, so the dashboard — which has no locale segment —
 * cannot live under it. Two route groups, two root layouts, one URL space:
 * `(site)` serves `/ar` and `/en`, `(admin)` serves `/admin`. The group names
 * are invisible in the URL.
 *
 * **Arabic, RTL, single locale.** The dashboard's only readers are the Qissati
 * team, who work in Arabic. Wiring it into the site's `[lang]` system would
 * buy an English translation nobody asked for at the cost of putting the
 * dashboard behind a locale segment and doubling every string.
 */

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "لوحة تحكم قصتي",
  applicationName: "قصتي",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "قصتي",
    statusBarStyle: "default",
  },
  // Nothing here is for the public, and a dashboard in a search index is a
  // map of the surface to attack.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport = {
  themeColor: "#146466",
};

export default function AdminLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <body className="min-h-full bg-cream font-sans text-ink">{children}</body>
    </html>
  );
}
