import confetti from 'canvas-confetti';

/**
 * Application Adapter wrapping canvas-confetti.
 * Respects reduced-motion preferences and provides domain-specific celebration presets.
 */
export function triggerQuizSuccessConfetti(originElement?: HTMLElement | null): void {
  if (typeof window === 'undefined') return;
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) return;

  let origin = { x: 0.5, y: 0.6 };
  if (originElement) {
    const rect = originElement.getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }

  void confetti({
    particleCount: 45,
    spread: 65,
    startVelocity: 26,
    scalar: 0.9,
    origin,
    colors: ['#0F766E', '#10B981', '#F59E0B', '#3B82F6'],
    disableForReducedMotion: true,
  });
}
