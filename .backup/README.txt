Pre-hero-rebuild snapshot (2026-08-30).

Only components/Hero.jsx actually changed — BookShowcase.jsx and ui/3d-card.jsx
were left in place, unwired, so the previous hero is one file away.

Revert:
  cp .backup/components/Hero.jsx components/Hero.jsx && rm -rf .backup components/HeroBook.jsx

TrustBar rebuild (2026-08-30) — revert that one on its own with:
  cp .backup/components/TrustBar.jsx components/TrustBar.jsx

HowItWorks rebuild (2026-08-30) — revert that one on its own with:
  cp .backup/components/HowItWorks.jsx .backup/components/StepsBeam.jsx components/ && rm -f components/StepsList.jsx

Eyebrow→Kicker flip + Tiers rebuild (2026-08-30). Revert:
  cp .backup/components/{Tiers,Pricing,Faq,BookReveal}.jsx components/
  (and restore the Eyebrow export in components/ui.jsx — see git diff)

SamplePreview rebuild (2026-08-30) — revert with:
  cp .backup/components/{SamplePreview,BookReveal}.jsx components/

Pricing rebuild (2026-08-30) — revert with:
  cp .backup/components/Pricing.jsx components/

Faq rebuild (2026-08-30) — revert with:
  cp .backup/components/Faq.jsx components/

FinalCta rebuild (2026-08-30) — revert with:
  cp .backup/components/FinalCta.jsx components/
