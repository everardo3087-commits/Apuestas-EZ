/**
 * Date and Timezone Utilities for Panama (America/Panama, UTC-5)
 * Standardizes all date comparisons, display formatting, and filters
 * to eliminate timezone drift between UTC, server runtime, and local browser.
 */

export const PANAMA_TIMEZONE = 'America/Panama';

/**
 * Returns YYYY-MM-DD string for a given date in Panama timezone (UTC-5)
 */
export function getPanamaDateString(date: Date | string | number = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  // Use Intl with 'en-CA' (always outputs YYYY-MM-DD)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PANAMA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Returns formatted 24h time HH:MM in Panama timezone (e.g. 14:30)
 */
export function getPanamaTimeString(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--:--';

  return new Intl.DateTimeFormat('es-PA', {
    timeZone: PANAMA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Returns formatted 12h time with AM/PM in Panama timezone (e.g. 2:30 PM)
 */
export function getPanamaTime12h(date: Date | string | number = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--:--';

  return new Intl.DateTimeFormat('es-PA', {
    timeZone: PANAMA_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Human friendly date string in Panama timezone (e.g. "Hoy 14:30 (Panamá)" or "Jue 22 Oct · 14:30")
 */
export function formatPanamaMatchSchedule(dateStr: string): {
  badge: 'HOY' | 'MAÑANA' | 'PRÓXIMO';
  display: string;
  panamaTime: string;
  panamaDate: string;
  isToday: boolean;
} {
  const d = new Date(dateStr);
  const isToday = isPanamaToday(d);
  const isTomorrow = isPanamaTomorrow(d);
  const time = getPanamaTimeString(d);

  const dateFormatted = new Intl.DateTimeFormat('es-PA', {
    timeZone: PANAMA_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);

  let badge: 'HOY' | 'MAÑANA' | 'PRÓXIMO' = 'PRÓXIMO';
  let display = `${dateFormatted} a las ${time} (Panamá)`;

  if (isToday) {
    badge = 'HOY';
    display = `Hoy a las ${time} (Hora Panamá)`;
  } else if (isTomorrow) {
    badge = 'MAÑANA';
    display = `Mañana a las ${time} (Hora Panamá)`;
  }

  return {
    badge,
    display,
    panamaTime: time,
    panamaDate: dateFormatted,
    isToday,
  };
}

/**
 * Check if the date is TODAY in Panama timezone
 */
export function isPanamaToday(date: Date | string | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  return getPanamaDateString(d) === getPanamaDateString(new Date());
}

/**
 * Check if the date is TOMORROW in Panama timezone
 */
export function isPanamaTomorrow(date: Date | string | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const matchYMD = getPanamaDateString(d);
  const tomorrowYMD = getPanamaFutureYMD(1);
  return matchYMD === tomorrowYMD;
}

/**
 * Check if the date falls in the next 7 days in Panama timezone
 */
export function isPanamaNext7Days(date: Date | string | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const matchYMD = getPanamaDateString(d);
  const todayYMD = getPanamaDateString(new Date());
  const in7DaysYMD = getPanamaFutureYMD(7);

  return matchYMD >= todayYMD && matchYMD <= in7DaysYMD;
}

/**
 * Check if the date falls within custom YYYY-MM-DD range in Panama timezone
 */
export function isWithinPanamaRange(
  date: Date | string | number,
  startYMD?: string,
  endYMD?: string
): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const matchYMD = getPanamaDateString(d);
  if (startYMD && matchYMD < startYMD) return false;
  if (endYMD && matchYMD > endYMD) return false;
  return true;
}

/**
 * Get future YYYY-MM-DD in Panama timezone
 */
export function getPanamaFutureYMD(daysAhead: number): string {
  // Add 24 * daysAhead hours in milliseconds
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 3600 * 1000);
  return getPanamaDateString(future);
}

/**
 * Current date in Panama as ISO timestamp object
 */
export function getPanamaNowInfo(): {
  dateYMD: string;
  time24: string;
  time12: string;
  fullString: string;
  timezoneLabel: string;
} {
  const now = new Date();
  const dateYMD = getPanamaDateString(now);
  const time24 = getPanamaTimeString(now);
  const time12 = getPanamaTime12h(now);

  const fullFormatter = new Intl.DateTimeFormat('es-PA', {
    timeZone: PANAMA_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    dateYMD,
    time24,
    time12,
    fullString: fullFormatter.format(now),
    timezoneLabel: 'Panamá (UTC-5)',
  };
}
