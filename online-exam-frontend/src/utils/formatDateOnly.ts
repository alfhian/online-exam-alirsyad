import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format ISO date string into "15 Sep 2025" format (Indonesian locale).
 * @param dateString - ISO date string or any valid date input
 * @returns Formatted date string or empty string if invalid
 */
function formatDateOnly(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return format(date, 'dd MMM yyyy', { locale: id });
}

export default formatDateOnly;