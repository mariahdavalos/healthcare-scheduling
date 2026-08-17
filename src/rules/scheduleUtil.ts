import { addDaysISO } from '../dateUtils';
import { ScheduleEntry } from '../types';

export function groupByProvider(schedule: ScheduleEntry[]): Map<string, ScheduleEntry[]> {
  const entriesByProvider = new Map<string, ScheduleEntry[]>();
  for (const entry of schedule) {
    if (!entry.providerId) continue;
    const entries = entriesByProvider.get(entry.providerId) ?? [];
    entries.push(entry);
    entriesByProvider.set(entry.providerId, entries);
  }
  for (const entries of entriesByProvider.values()) {
    entries.sort((first, second) => first.startDateTime.getTime() - second.startDateTime.getTime());
  }
  return entriesByProvider;
}

/** Runs of night shifts on consecutive calendar dates, sorted chronologically. */
export function nightRuns(entries: ScheduleEntry[]): ScheduleEntry[][] {
  const nights = entries.filter((entry) => entry.isNight).sort((first, second) => first.shiftDate.localeCompare(second.shiftDate));
  const runs: ScheduleEntry[][] = [];
  let currentRun: ScheduleEntry[] = [];
  for (const night of nights) {
    if (currentRun.length > 0 && addDaysISO(currentRun[currentRun.length - 1].shiftDate, 1) === night.shiftDate) {
      currentRun.push(night);
    } else {
      if (currentRun.length > 0) runs.push(currentRun);
      currentRun = [night];
    }
  }
  if (currentRun.length > 0) runs.push(currentRun);
  return runs;
}

export function mean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((total, value) => total + value, 0) / numbers.length;
}
