import { Logo } from "./Logo";
import { InstagramIcon } from "./ui";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export default function Footer({ dict }) {
  const t = dict.footer;

  return (
    <footer className="mt-auto bg-brand-deep text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          {/* the wordmark inverts on the deep-teal footer */}
          <Logo markClass="h-14" wordClass="text-cream" wordmark={dict.brand.wordmark} />
          <p className="text-base text-cream/80">{t.tagline}</p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2.5 font-bold transition-colors hover:bg-white/20"
          >
            <InstagramIcon className="h-5 w-5" aria-hidden="true" />
            <span dir="ltr">{INSTAGRAM_HANDLE}</span>
          </a>
          <p className="text-sm text-cream/80">
{t.contactNote}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-center text-sm text-cream/80 sm:px-8">
{t.copyright.replace("{year}", new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}
