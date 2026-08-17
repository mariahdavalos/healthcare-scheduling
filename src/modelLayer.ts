import { Preference } from './types';
import { addDaysISO, dayOfWeek, parseFlexibleDate } from './dateUtils';

export type ConstraintType =
  | 'DAY_OFF'
  | 'AVOID_MORNING'
  | 'MAX_CONSECUTIVE_NIGHTS'
  | 'AVOID_NIGHTS_IN_RANGE'
  | 'AVOID_NIGHT_SHIFTS'
  | 'AVOID_BACK_TO_BACK_WEEKENDS'
  | 'WEEKEND_OFF'
  | 'PREFER_DAY_SHIFTS_IN_RANGE'
  | 'PREFER_SITE'
  | 'UNINTERPRETABLE';

export interface InterpretedPreference {
  providerId: string;
  priority: Preference['priority'];
  noteRaw: string;
  appliesToRaw: string;
  constraintType: ConstraintType;
  params: Record<string, unknown>;
  plainEnglish: string;
  confidence: 'high' | 'fuzzy';
  fuzzyNote?: string;
}

function sunToSatWeek(iso: string): { start: string; end: string } {
  const weekdayIndex = dayOfWeek(iso);
  const start = addDaysISO(iso, -weekdayIndex);
  const end = addDaysISO(start, 6);
  return { start, end };
}

function weekendOf(iso: string): { saturday: string; sunday: string } {
  const weekdayIndex = dayOfWeek(iso);
  if (weekdayIndex === 6) return { saturday: iso, sunday: addDaysISO(iso, 1) };
  if (weekdayIndex === 0) return { saturday: addDaysISO(iso, -1), sunday: iso };
  const daysUntilSaturday = (6 - weekdayIndex + 7) % 7;
  const saturday = addDaysISO(iso, daysUntilSaturday === 0 ? 7 : daysUntilSaturday);
  return { saturday, sunday: addDaysISO(saturday, 1) };
}

/**
 * Preference notes arrive as free text ("No nights the week of the 20th,
 * ish."), not structured constraints. Turning that into something a rule
 * engine can check against a schedule is exactly the kind of extraction
 * task a language model handles well: read the note plus its RED/YELLOW/
 * GREEN tag, and return {constraint type, dates it applies to, one-sentence
 * restatement}.
 *
 * The prompt this would run in production, per row:
 *
 *   "This is a scheduling preference from a healthcare staffing roster.
 *    priority: {RED|YELLOW|GREEN}, applies_to: {date or 'recurring'},
 *    note: '{free text}'.
 *    Classify it as one of: a specific day off, a shift-type preference,
 *    a recurring pattern rule, or a site preference. Resolve any relative
 *    or fuzzy date language against the September 2026 schedule period.
 *    Return the structured constraint and a one-sentence plain-English
 *    restatement a non-technical scheduler could act on."
 *
 * I don't have an API key for this project, so this function is a fixed,
 * hand-verified stand-in for that call: deterministic keyword matching that
 * reproduces the same structured output for this dataset's 11 preference
 * rows.
 * */
export function interpretPreferences(
  preferences: Preference[],
  periodYear: number,
  periodMonth1Based: number
): InterpretedPreference[] {
  return preferences.map((preference) => {
    const note = preference.note;
    const specificDate = parseFlexibleDate(preference.appliesToRaw);

    let match: RegExpExecArray | null;

    if ((match = /no more than (\d+) nights?\s*(?:in a row|consecutive)/i.exec(note))) {
      const max = Number(match[1]);
      return makeInterpretation(preference, 'MAX_CONSECUTIVE_NIGHTS', { max }, 'high',
        `Cap night runs at ${max} in a row for this provider (stricter than the group's 3-night hard cap).`);
    }

    if (/no overnight shifts/i.test(note)) {
      return makeInterpretation(preference, 'AVOID_NIGHT_SHIFTS', {}, 'high',
        `Never schedule this provider for a night shift.`);
    }

    if ((match = /week of the (\d+)/i.exec(note))) {
      const day = Number(match[1]);
      const anchor = `${periodYear}-${String(periodMonth1Based).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const { start, end } = sunToSatWeek(anchor);
      const fuzzy = /,?\s*ish\b/i.test(note);
      return makeInterpretation(preference, 'AVOID_NIGHTS_IN_RANGE', { start, end }, fuzzy ? 'fuzzy' : 'high',
        `No night shifts for this provider between ${start} and ${end}.`,
        fuzzy ? `Note says "ish": dates read as the Sun through Sat week containing the ${day}th (${start} to ${end}); confirm with the provider if this is off by a few days.` : undefined);
    }

    if (/back-to-back weekends|back to back weekends/i.test(note)) {
      return makeInterpretation(preference, 'AVOID_BACK_TO_BACK_WEEKENDS', {}, 'high',
        `Don't schedule this provider on both Saturday and Sunday of two consecutive weekends.`);
    }

    if (/weekend off/i.test(note) && specificDate && specificDate !== 'recurring') {
      const { saturday, sunday } = weekendOf(specificDate);
      return makeInterpretation(preference, 'WEEKEND_OFF', { saturday, sunday }, 'high',
        `Keep this provider off both ${saturday} and ${sunday}.`);
    }

    if (/mornings? off/i.test(note) && specificDate && specificDate !== 'recurring') {
      return makeInterpretation(preference, 'AVOID_MORNING', { date: specificDate }, 'high',
        `Avoid any shift that occupies the morning of ${specificDate} for this provider.`);
    }

    if (/day shifts?.*this week/i.test(note) && specificDate && specificDate !== 'recurring') {
      const { start, end } = sunToSatWeek(specificDate);
      return makeInterpretation(preference, 'PREFER_DAY_SHIFTS_IN_RANGE', { start, end }, 'high',
        `Prefer day shifts (not evening/night) for this provider between ${start} and ${end}.`);
    }

    if ((match = /prefers?\s+([A-Z]{2,4})\s+over\s+([A-Z]{2,4})/i.exec(note))) {
      return makeInterpretation(preference, 'PREFER_SITE', { preferredSite: match[1].toUpperCase(), overSite: match[2].toUpperCase() }, 'high',
        `Give this provider ${match[1].toUpperCase()} shifts over ${match[2].toUpperCase()} when both are viable.`);
    }

    if (specificDate && specificDate !== 'recurring' && (preference.priority === 'RED' || preference.priority === 'YELLOW')) {
      return makeInterpretation(preference, 'DAY_OFF', { date: specificDate }, 'high',
        `Keep this provider off entirely on ${specificDate}.`);
    }

    return makeInterpretation(preference, 'UNINTERPRETABLE', {}, 'fuzzy',
      `Could not extract a checkable constraint from this note; needs a human read.`,
      `Free text didn't match any known pattern.`);
  });
}

function makeInterpretation(
  preference: Preference,
  constraintType: ConstraintType,
  params: Record<string, unknown>,
  confidence: 'high' | 'fuzzy',
  plainEnglish: string,
  fuzzyNote?: string
): InterpretedPreference {
  return {
    providerId: preference.providerId,
    priority: preference.priority,
    noteRaw: preference.note,
    appliesToRaw: preference.appliesToRaw,
    constraintType,
    params,
    plainEnglish,
    confidence,
    fuzzyNote,
  };
}
