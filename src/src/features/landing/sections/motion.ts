import type { Variants } from 'framer-motion';

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.12 as const,
};

export const VIEWPORT_CENTER = {
  once: true,
  amount: 0.3 as const,
};

/* ── Containers ───────────────────────────────────────────────────── */

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.04,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.02,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.06,
    },
  },
};

/* ── Items ────────────────────────────────────────────────────────── */

/** Classic fade + translate-up */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: EASE_OUT_EXPO },
  },
};

/** Fade + slight scale (cards, images) */
export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

/** Blur + fade-up — premium feel for headings */
export const blurUp: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

/** Slide in from the inline-end (right in LTR, left in RTL) */
export const slideInFromEnd: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.58, ease: EASE_OUT_EXPO },
  },
};

/** Slide in from the inline-start */
export const slideInFromStart: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.58, ease: EASE_OUT_EXPO },
  },
};

/** Zoom + fade — great for stat numbers */
export const zoomIn: Variants = {
  hidden: { opacity: 0, scale: 0.72 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

/** Short fade-only — subtle presence for decorative elements */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: EASE_IN_OUT },
  },
};

/** Used for horizontal rule / accent line draw */
export const drawLine: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.55, ease: EASE_OUT_EXPO },
  },
};
