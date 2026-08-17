import { addDaysISO, friendlyDate, isWeekend } from '../dateUtils';
import { interpretPreferences } from '../modelLayer';
import { Finding, Provider, RawData, ScheduleEntry } from '../types';
import { groupByProvider, mean, nightRuns } from './scheduleUtil';

let counter = 0;
function nextId(rule: string): string {
  counter += 1;
  return `${rule}-${String(counter).padStart(3, '0')}`;
}

const PRIORITY_RANK: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };

export function checkSoftGoals(data: RawData): Finding[] {
  const findings: Finding[] = [];
  const providersById = new Map(data.providers.map((provider) => [provider.providerId, provider]));
  const scheduleByProvider = groupByProvider(data.schedule);

  findings.push(...checkS1(data, providersById, scheduleByProvider));
  findings.push(...checkS2(data.providers, scheduleByProvider));
  findings.push(...checkS3(data.providers, scheduleByProvider));
  findings.push(...checkS4(data.providers, scheduleByProvider));

  return findings.sort((first, second) => rankOf(first) - rankOf(second));
}

function rankOf(finding: Finding): number {
  const priority = finding.evidence.preferencePriority as string | undefined;
  return priority ? PRIORITY_RANK[priority] ?? 3 : 3;
}

function providerLabel(provider: Provider | undefined, providerId: string): string {
  return provider ? `${provider.name} (${providerId})` : providerId;
}

// S1 — honor stated preferences (RED > YELLOW > GREEN)
function checkS1(
  data: RawData,
  providersById: Map<string, Provider>,
  scheduleByProvider: Map<string, ScheduleEntry[]>
): Finding[] {
  const findings: Finding[] = [];
  const periodStart = data.coverage.reduce((earliest, requirement) => (requirement.shiftDate < earliest ? requirement.shiftDate : earliest), data.coverage[0].shiftDate);
  const [periodYear, periodMonth] = periodStart.split('-').map(Number);
  const interpreted = interpretPreferences(data.preferences, periodYear, periodMonth);

  for (const pref of interpreted) {
    const provider = providersById.get(pref.providerId);
    const entries = scheduleByProvider.get(pref.providerId) ?? [];
    const label = providerLabel(provider, pref.providerId);

    const violation = (summary: string, detail: string, evidence: Record<string, unknown> = {}) => {
      findings.push({
        id: nextId('S1'),
        severity: 'SOFT',
        rule: 'S1',
        ruleName: 'Honor stated preferences',
        providerId: pref.providerId,
        providerName: provider?.name ?? null,
        siteCode: null,
        shiftDate: null,
        shiftCode: null,
        summary,
        detail: `${detail} Preference: "${pref.noteRaw}". ${pref.plainEnglish}${pref.fuzzyNote ? ` (${pref.fuzzyNote})` : ''}`,
        evidence: { ...evidence, preferencePriority: pref.priority, interpreted: pref },
        suggestedAction: pref.priority === 'RED'
          ? 'RED is a hardship request: only break it if nothing else works. Re-check whether another provider can cover.'
          : 'Swap this shift with another provider if the schedule allows it.',
      });
    };

    switch (pref.constraintType) {
      case 'DAY_OFF': {
        const date = pref.params.date as string;
        const hits = entries.filter((entry) => entry.shiftDate === date);
        if (hits.length > 0) {
          violation(
            `${label} asked for ${friendlyDate(date)} off but is scheduled ${hits.map((hit) => hit.shiftCode).join(', ')}`,
            `Requested day off on ${friendlyDate(date)}.`,
            { date, scheduledShifts: hits }
          );
        }
        break;
      }
      case 'AVOID_MORNING': {
        const date = pref.params.date as string;
        const morningStart = new Date(`${date}T00:00:00.000Z`);
        const morningEnd = new Date(`${date}T12:00:00.000Z`);
        const hits = entries.filter((entry) => entry.startDateTime < morningEnd && entry.endDateTime > morningStart);
        if (hits.length > 0) {
          violation(
            `${label} asked for the morning of ${friendlyDate(date)} off but is scheduled ${hits.map((hit) => hit.shiftCode).join(', ')}`,
            `Requested morning off on ${friendlyDate(date)}.`,
            { date, scheduledShifts: hits }
          );
        }
        break;
      }
      case 'MAX_CONSECUTIVE_NIGHTS': {
        const max = pref.params.max as number;
        for (const run of nightRuns(entries)) {
          if (run.length > max) {
            violation(
              `${label} asked for no more than ${max} nights in a row but has ${run.length} in a row (${friendlyDate(run[0].shiftDate)} to ${friendlyDate(run[run.length - 1].shiftDate)})`,
              `Personal cap of ${max} consecutive nights (stricter than the group's 3-night hard limit).`,
              { run }
            );
          }
        }
        break;
      }
      case 'AVOID_NIGHTS_IN_RANGE': {
        const { start, end } = pref.params as { start: string; end: string };
        const hits = entries.filter((entry) => entry.isNight && entry.shiftDate >= start && entry.shiftDate <= end);
        if (hits.length > 0) {
          violation(
            `${label} asked for no nights between ${friendlyDate(start)} and ${friendlyDate(end)} but is scheduled ${hits.map((hit) => `${hit.shiftCode} on ${friendlyDate(hit.shiftDate)}`).join(', ')}`,
            `Requested no nights in this window.`,
            { start, end, scheduledShifts: hits }
          );
        }
        break;
      }
      case 'AVOID_NIGHT_SHIFTS': {
        const hits = entries.filter((entry) => entry.isNight);
        if (hits.length > 0) {
          violation(
            `${label} has a standing "no overnight shifts" agreement but is scheduled for ${hits.length} night shift(s): ${hits.map((hit) => friendlyDate(hit.shiftDate)).join(', ')}`,
            `Standing no-nights agreement.`,
            { scheduledShifts: hits }
          );
        }
        break;
      }
      case 'AVOID_BACK_TO_BACK_WEEKENDS': {
        const weekendsWorked = weekendsWithShifts(entries);
        for (let weekendIndex = 0; weekendIndex < weekendsWorked.length - 1; weekendIndex++) {
          if (addDaysISO(weekendsWorked[weekendIndex], 7) === weekendsWorked[weekendIndex + 1]) {
            violation(
              `${label} asked not to work back-to-back weekends but is scheduled both the weekend of ${friendlyDate(weekendsWorked[weekendIndex])} and ${friendlyDate(weekendsWorked[weekendIndex + 1])}`,
              `Requested no consecutive weekends.`,
              { weekends: [weekendsWorked[weekendIndex], weekendsWorked[weekendIndex + 1]] }
            );
          }
        }
        break;
      }
      case 'WEEKEND_OFF': {
        const { saturday, sunday } = pref.params as { saturday: string; sunday: string };
        const hits = entries.filter((entry) => entry.shiftDate === saturday || entry.shiftDate === sunday);
        if (hits.length > 0) {
          violation(
            `${label} asked for the ${friendlyDate(saturday)}/${friendlyDate(sunday)} weekend off but is scheduled ${hits.map((hit) => `${hit.shiftCode} on ${friendlyDate(hit.shiftDate)}`).join(', ')}`,
            `Requested that weekend off.`,
            { saturday, sunday, scheduledShifts: hits }
          );
        }
        break;
      }
      case 'PREFER_DAY_SHIFTS_IN_RANGE': {
        const { start, end } = pref.params as { start: string; end: string };
        const hits = entries.filter((entry) => entry.shiftDate >= start && entry.shiftDate <= end && !entry.shiftCode.endsWith('-D'));
        if (hits.length > 0) {
          violation(
            `${label} prefers day shifts between ${friendlyDate(start)} and ${friendlyDate(end)} but has ${hits.map((hit) => `${hit.shiftCode} on ${friendlyDate(hit.shiftDate)}`).join(', ')}`,
            `Preferred day shifts in this window.`,
            { start, end, scheduledShifts: hits }
          );
        }
        break;
      }
      case 'PREFER_SITE': {
        const { preferredSite, overSite } = pref.params as { preferredSite: string; overSite: string };
        const preferredCount = entries.filter((entry) => entry.siteCode === preferredSite).length;
        const otherCount = entries.filter((entry) => entry.siteCode === overSite).length;
        if (preferredCount + otherCount > 0) {
          findings.push({
            id: nextId('S1'),
            severity: 'SOFT',
            rule: 'S1',
            ruleName: 'Honor stated preferences',
            providerId: pref.providerId,
            providerName: provider?.name ?? null,
            siteCode: null,
            shiftDate: null,
            shiftCode: null,
            summary: `${label} prefers ${preferredSite} over ${overSite}. Currently ${preferredCount} ${preferredSite} vs ${otherCount} ${overSite} shifts (informational; can't tell from the data whether ${overSite} assignments were unavoidable for coverage)`,
            detail: `"${pref.noteRaw}"`,
            evidence: { preferredSite, overSite, preferredCount, otherCount, preferencePriority: pref.priority, interpreted: pref },
            suggestedAction: otherCount > preferredCount
              ? `Check whether some of the ${overSite} shifts could move to ${preferredSite} without leaving a gap.`
              : 'No action needed. The split already favors the preferred site.',
          });
        }
        break;
      }
      case 'UNINTERPRETABLE': {
        findings.push({
          id: nextId('S1'),
          severity: 'DATA_ISSUE',
          rule: 'S1',
          ruleName: 'Honor stated preferences (unparseable note)',
          providerId: pref.providerId,
          providerName: provider?.name ?? null,
          siteCode: null,
          shiftDate: null,
          shiftCode: null,
          summary: `${label}'s preference note couldn't be automatically interpreted: "${pref.noteRaw}"`,
          detail: `applies_to: ${pref.appliesToRaw}, priority: ${pref.priority}. A person needs to read this one.`,
          evidence: { preferencePriority: pref.priority, interpreted: pref },
          suggestedAction: 'Read the note manually and check the schedule by hand.',
        });
        break;
      }
    }
  }
  return findings;
}

function weekendsWithShifts(entries: ScheduleEntry[]): string[] {
  const saturdaysWorked = new Set<string>();
  for (const entry of entries) {
    if (!isWeekend(entry.shiftDate)) continue;
    // Normalize to "the Saturday of this weekend" so Sat/Sun pair together.
    const weekdayIndex = new Date(`${entry.shiftDate}T00:00:00.000Z`).getUTCDay();
    const saturday = weekdayIndex === 0 ? addDaysISO(entry.shiftDate, -1) : entry.shiftDate;
    saturdaysWorked.add(saturday);
  }
  return Array.from(saturdaysWorked).sort();
}

// S2 — distribute night shifts equitably across night-eligible providers, scaled to target load
function checkS2(providers: Provider[], scheduleByProvider: Map<string, ScheduleEntry[]>): Finding[] {
  const findings: Finding[] = [];
  const pool = providers.filter((provider) => provider.role === 'Physician' && provider.nightEligible);
  const shares = pool.map((provider) => {
    const entries = scheduleByProvider.get(provider.providerId) ?? [];
    const nightCount = entries.filter((entry) => entry.isNight).length;
    const targetShiftEquivalent = provider.targetType === 'SHIFTS' ? provider.targetValue ?? entries.length : entries.length;
    return { provider, nightCount, share: targetShiftEquivalent > 0 ? nightCount / targetShiftEquivalent : nightCount };
  });
  const avgShare = mean(shares.map((share) => share.share));
  for (const share of shares) {
    if (avgShare === 0) continue;
    const relDelta = (share.share - avgShare) / avgShare;
    if (Math.abs(relDelta) > 0.5 && Math.abs(share.nightCount - mean(shares.map((otherShare) => otherShare.nightCount))) >= 2) {
      findings.push({
        id: nextId('S2'),
        severity: 'SOFT',
        rule: 'S2',
        ruleName: 'Distribute night shifts equitably, scaled to target load',
        providerId: share.provider.providerId,
        providerName: share.provider.name,
        siteCode: null,
        shiftDate: null,
        shiftCode: null,
        summary: `${share.provider.name} (${share.provider.providerId}) is scheduled for ${share.nightCount} night shift(s), ${relDelta > 0 ? 'well above' : 'well below'} the night-eligible group average of ${mean(shares.map((otherShare) => otherShare.nightCount)).toFixed(1)}`,
        detail: `Night-eligible physicians in this period: ${pool.map((provider) => provider.name).join(', ')}.`,
        evidence: { nightCount: share.nightCount, groupAverage: mean(shares.map((otherShare) => otherShare.nightCount)), poolSize: pool.length },
        suggestedAction: relDelta > 0
          ? 'Move some of this provider’s night shifts to a night-eligible physician with fewer nights.'
          : 'This provider has room to pick up more night shifts if others are overloaded.',
      });
    }
  }
  return findings;
}

// S3 — avoid island nights; day after a night block should be a recovery day
function checkS3(providers: Provider[], scheduleByProvider: Map<string, ScheduleEntry[]>): Finding[] {
  const findings: Finding[] = [];
  const providersById = new Map(providers.map((provider) => [provider.providerId, provider]));
  for (const [providerId, entries] of scheduleByProvider) {
    const provider = providersById.get(providerId);
    const runs = nightRuns(entries);
    for (const run of runs) {
      if (run.length === 1) {
        findings.push({
          id: nextId('S3'),
          severity: 'SOFT',
          rule: 'S3',
          ruleName: 'Avoid island nights',
          providerId,
          providerName: provider?.name ?? null,
          siteCode: run[0].siteCode,
          shiftDate: run[0].shiftDate,
          shiftCode: run[0].shiftCode,
          summary: `${providerLabel(provider, providerId)} has a single, isolated night shift on ${friendlyDate(run[0].shiftDate)} (${run[0].shiftCode}), not adjacent to another night`,
          detail: `Night blocks of 2–3 are the norm and preferred; a lone night shift is disruptive to sleep and is what S3 flags.`,
          evidence: { run },
          suggestedAction: 'Pair this with an adjacent night shift, or move it to someone already working a night block nearby.',
        });
      }
      const recoveryDay = addDaysISO(run[run.length - 1].shiftDate, 1);
      const scheduledOnRecoveryDay = entries.filter((entry) => entry.shiftDate === recoveryDay);
      if (scheduledOnRecoveryDay.length > 0) {
        findings.push({
          id: nextId('S3'),
          severity: 'SOFT',
          rule: 'S3',
          ruleName: 'Recovery day after a night block',
          providerId,
          providerName: provider?.name ?? null,
          siteCode: scheduledOnRecoveryDay[0].siteCode,
          shiftDate: recoveryDay,
          shiftCode: scheduledOnRecoveryDay[0].shiftCode,
          summary: `${providerLabel(provider, providerId)} is scheduled on ${friendlyDate(recoveryDay)}, the day right after a ${run.length}-night block (${friendlyDate(run[0].shiftDate)} to ${friendlyDate(run[run.length - 1].shiftDate)})`,
          detail: `The group's own notes treat the day after a night block as a recovery day providers expect off.`,
          evidence: { run, recoveryDay, scheduledOnRecoveryDay },
          suggestedAction: 'Give this provider the day after the night block off; reassign the recovery-day shift.',
        });
      }
    }
  }
  return findings;
}

// S4 — distribute weekend shifts equitably
function checkS4(providers: Provider[], scheduleByProvider: Map<string, ScheduleEntry[]>): Finding[] {
  const findings: Finding[] = [];
  const counts = providers.map((provider) => ({
    provider,
    count: (scheduleByProvider.get(provider.providerId) ?? []).filter((entry) => isWeekend(entry.shiftDate)).length,
  }));
  const avg = mean(counts.map((providerCount) => providerCount.count));
  if (avg === 0) return findings;
  for (const providerCount of counts) {
    const relDelta = (providerCount.count - avg) / avg;
    if (Math.abs(relDelta) > 0.5 && Math.abs(providerCount.count - avg) >= 2) {
      findings.push({
        id: nextId('S4'),
        severity: 'SOFT',
        rule: 'S4',
        ruleName: 'Distribute weekend shifts equitably',
        providerId: providerCount.provider.providerId,
        providerName: providerCount.provider.name,
        siteCode: null,
        shiftDate: null,
        shiftCode: null,
        summary: `${providerCount.provider.name} (${providerCount.provider.providerId}) works ${providerCount.count} weekend shift(s), vs. a group average of ${avg.toFixed(1)}`,
        detail: `Counts every Saturday/Sunday shift across the whole roster.`,
        evidence: { weekendCount: providerCount.count, groupAverage: avg },
        suggestedAction: relDelta > 0
          ? 'Move a weekend shift or two to someone below the group average.'
          : 'This provider has room to take on more weekend coverage if others are overloaded.',
      });
    }
  }
  return findings;
}
