/**
 * anime.js is invisible to the global reduced-motion kill-switch in
 * globals.css — that rule collapses CSS `animation-duration`, and anime drives
 * inline styles through rAF instead. Every anime call in this project has to
 * check this and resolve straight to its finished state.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * True when hydration happened late enough that the user has already been
 * looking at the page. Replaying an entrance at that point reads as a glitch,
 * so intro timelines opt out.
 */
export const isLateHydration = (budgetMs = 1500) =>
  typeof performance !== "undefined" && performance.now() > budgetMs;

/**
 * anime's engine pauses itself while the document is hidden, and browsers
 * throttle rAF in background tabs regardless. An animation started there does
 * not run — it just applies its FROM value and sits there, which for an
 * entrance means the element is left visibly displaced until the tab is
 * focused. So a hidden document is treated exactly like reduced motion:
 * skip the animation, render the finished state.
 *
 * Check this BEFORE writing any starting transform, not after.
 */
export const canAnimate = () =>
  typeof document !== "undefined" &&
  document.visibilityState === "visible" &&
  !prefersReducedMotion();
