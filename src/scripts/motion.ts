/**
 * Whether animated UI should be suppressed: either the visitor turned motion
 * off with the masthead toggle, or the OS asks for reduced motion.
 */
export function motionDisabled(): boolean {
  if (typeof document === 'undefined') return false
  return (
    document.documentElement.getAttribute('data-animations') === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
