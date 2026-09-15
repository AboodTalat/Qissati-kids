import { absoluteUrl } from "@/lib/seo";

const languages = {
  "ar-JO": absoluteUrl("/ar"),
  en: absoluteUrl("/en"),
  "x-default": absoluteUrl("/ar"),
};

const sampleImages = [
  "/samples/q-000002/cover.jpg",
  ...Array.from(
    { length: 10 },
    (_, index) => `/samples/q-000002/page-${String(index + 1).padStart(2, "0")}.jpg`,
  ),
].map(absoluteUrl);

export default function sitemap() {
  return ["ar", "en"].map((lang) => ({
    url: absoluteUrl(`/${lang}`),
    changeFrequency: "weekly",
    priority: lang === "ar" ? 1 : 0.9,
    alternates: { languages },
    images: sampleImages,
  }));
}
