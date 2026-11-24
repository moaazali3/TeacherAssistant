import { BorderRadius, ButtonStyle } from '../types';

export function getRadiusClass(radius?: BorderRadius): string {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'md':
      return 'rounded-lg';
    case 'xl':
      return 'rounded-2xl';
    case 'full':
      return 'rounded-full';
    default:
      return 'rounded-2xl';
  }
}

export function getButtonStyleClasses(style?: ButtonStyle, isPrimary = true): string {
  const base =
    'transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2';

  if (isPrimary) {
    switch (style) {
      case 'outline':
        return `${base} border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-bold`;
      case 'soft':
        return `${base} bg-primary-light text-primary font-bold hover:bg-primary hover:text-primary-foreground border border-primary/20`;
      case 'solid':
      default:
        return `${base} bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:shadow-[0_12px_24px_-6px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] font-bold`;
    }
  } else {
    switch (style) {
      case 'outline':
        return `${base} border-2 border-border text-text-main bg-transparent hover:border-primary/40 hover:bg-surface-hover font-semibold`;
      case 'soft':
        return `${base} bg-surface-hover text-text-main hover:bg-border/60 border border-border/70 font-semibold`;
      case 'solid':
      default:
        return `${base} bg-surface border border-border text-text-main hover:border-primary/40 hover:bg-surface-hover shadow-xs font-semibold`;
    }
  }
}
