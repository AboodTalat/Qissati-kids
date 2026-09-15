"use client";

import { FlipWords } from "@/components/ui/flip-words";

// The role list comes from dict.hero.roles — the brief's own story types,
// so this cycles real product options rather than decorative filler.
export default function HeroRoles({ roles }) {
  return (
    <FlipWords
      words={roles}
      duration={2200}
      className="!px-0 font-extrabold text-gold"
    />
  );
}
