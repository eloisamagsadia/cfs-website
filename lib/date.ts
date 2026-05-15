/**
 * CFS Date Utilities — All times in Philippine Time (UTC+8)
 */

export const PHT_OFFSET = 8 * 60; // minutes

/**
 * Get current time in PHT
 */
export function nowPHT(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + PHT_OFFSET * 60000);
}

/**
 * Parse a date string as PHT (for datetime-local inputs)
 */
export function parsePHT(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  // If already has timezone info, just parse
  if (dateStr.includes("+") || dateStr.endsWith("Z")) return new Date(dateStr);
  // Treat as PHT (UTC+8)
  return new Date(dateStr + "+08:00");
}

/**
 * Format date in PHT for display
 */
export function formatPHT(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    ...options,
  });
}

/**
 * Format datetime in PHT
 */
export function formatDateTimePHT(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convert datetime-local input value to ISO with PHT timezone
 */
export function toISOWithPHT(localDateStr: string): string | null {
  if (!localDateStr) return null;
  return localDateStr + ":00+08:00";
}

/**
 * Convert a UTC date string to PHT datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export function toPHTInputString(utcDateStr: string): string {
  if (!utcDateStr) return "";
  const date = new Date(utcDateStr);
  // Convert to PHT (UTC+8)
  const pht = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return pht.toISOString().slice(0, 16);
}
