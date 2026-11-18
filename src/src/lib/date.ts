import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { arEG } from 'date-fns/locale';

/**
 * Safely parses a date string or Date object.
 */
function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? d : null;
}

/**
 * Formats a date in Arabic short/medium format (e.g., "17 نوفمبر 2026").
 */
export function formatDateArabic(
  date: string | Date | null | undefined,
  pattern = 'd MMMM yyyy'
): string {
  const d = toDate(date);
  if (!d) return '—';
  try {
    return format(d, pattern, { locale: arEG });
  } catch {
    return '—';
  }
}

/**
 * Formats a date relative to now in Arabic (e.g., "منذ 3 ساعات", "منذ يومين").
 */
export function formatRelativeArabic(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: arEG });
  } catch {
    return '—';
  }
}
