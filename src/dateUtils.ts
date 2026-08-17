const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function excelSerialToISODate(serial: number): string {
  const milliseconds = EXCEL_EPOCH_UTC_MS + Math.round(serial) * MS_PER_DAY;
  return new Date(milliseconds).toISOString().slice(0, 10);
}

export function excelFractionToTime(fraction: number): string {
  const totalMinutes = Math.round(fraction * 24 * 60) % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Preference `applies_to` values are free-form and inconsistent in the source
 * file: some are Excel date serials, some are "M/D/YYYY" strings, some are
 * "Mon D YYYY" free text, and some are the literal string "recurring".
 * Returns an ISO date, the literal "recurring", or null if unparseable.
 */
export function parseFlexibleDate(rawValue: unknown): string | null {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  if (typeof rawValue === 'number') {
    return excelSerialToISODate(rawValue);
  }

  const trimmed = String(rawValue).trim();
  if (trimmed.toLowerCase() === 'recurring') return 'recurring';

  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (match) {
    const [, year, month, day] = match;
    return excelSerialToISODate(
      Math.round((Date.UTC(+year, +month - 1, +day) - EXCEL_EPOCH_UTC_MS) / MS_PER_DAY)
    );
  }

  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (match) {
    const [, month, day, year] = match;
    return excelSerialToISODate(
      Math.round((Date.UTC(+year, +month - 1, +day) - EXCEL_EPOCH_UTC_MS) / MS_PER_DAY)
    );
  }

  match = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(trimmed);
  if (match) {
    const [, monthName, day, year] = match;
    const monthIndex = MONTHS[monthName.toLowerCase()];
    if (monthIndex !== undefined) {
      return excelSerialToISODate(
        Math.round((Date.UTC(+year, monthIndex, +day) - EXCEL_EPOCH_UTC_MS) / MS_PER_DAY)
      );
    }
  }

  return null;
}

export function isoToUTCDate(iso: string, time = '00:00'): Date {
  return new Date(`${iso}T${time}:00.000Z`);
}

export function addDaysISO(iso: string, days: number): string {
  const date = isoToUTCDate(iso);
  return new Date(date.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function diffHours(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60);
}

export function dayOfWeek(iso: string): number {
  return isoToUTCDate(iso).getUTCDay();
}

export function isWeekend(iso: string): boolean {
  const weekdayIndex = dayOfWeek(iso);
  return weekdayIndex === 0 || weekdayIndex === 6;
}

/**
 * Finding text goes in front of a scheduler, not a machine, so dates and
 * times in `summary`/`detail` strings use these instead of raw ISO/24h
 * values. 
 */
export function friendlyDate(iso: string): string {
  return isoToUTCDate(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function friendlyTime(hhmm: string): string {
  const [hour, minute] = hhmm.split(':').map(Number);
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${hour12} ${period}` : `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}
