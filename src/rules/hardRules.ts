import { diffHours, friendlyDate, friendlyTime } from '../dateUtils';
import { ApprovedLeave, Finding, Provider, RawData, ScheduleEntry } from '../types';
import { groupByProvider, nightRuns } from './scheduleUtil';

let counter = 0;
function nextId(rule: string): string {
  counter += 1;
  return `${rule}-${String(counter).padStart(3, '0')}`;
}

function providerLabel(provider: Provider | undefined, providerId: string): string {
  return provider ? `${provider.name} (${providerId})` : providerId;
}

export function checkHardRules(data: RawData): Finding[] {
  const findings: Finding[] = [];
  const providersById = new Map(data.providers.map((provider) => [provider.providerId, provider]));
  const scheduleByProvider = groupByProvider(data.schedule);

  findings.push(...checkH1(data));
  findings.push(...checkH2(data, providersById));
  findings.push(...checkH3(data, providersById));
  findings.push(...checkH4(scheduleByProvider, providersById));
  findings.push(...checkH5(scheduleByProvider, providersById));
  findings.push(...checkH6(scheduleByProvider, providersById));
  findings.push(...checkH7(data, providersById));
  findings.push(...checkH8(data.providers, scheduleByProvider));
  findings.push(...checkH9(data.providers, scheduleByProvider));

  return findings;
}

// H1 — every required shift covered by exactly one provider.
function checkH1(data: RawData): Finding[] {
  const findings: Finding[] = [];
  const scheduleByKey = new Map<string, ScheduleEntry[]>();
  for (const entry of data.schedule) {
    const entriesForKey = scheduleByKey.get(entry.key) ?? [];
    entriesForKey.push(entry);
    scheduleByKey.set(entry.key, entriesForKey);
  }
  const coverageKeys = new Set(data.coverage.map((requirement) => requirement.key));

  for (const requirement of data.coverage) {
    const entries = scheduleByKey.get(requirement.key) ?? [];
    if (entries.length === 0) {
      findings.push({
        id: nextId('H1'),
        severity: 'HARD',
        rule: 'H1',
        ruleName: 'Every required shift covered by exactly one provider',
        providerId: null,
        providerName: null,
        siteCode: requirement.siteCode,
        shiftDate: requirement.shiftDate,
        shiftCode: requirement.shiftCode,
        summary: `${requirement.shiftCode} on ${friendlyDate(requirement.shiftDate)} has no row in the draft schedule at all`,
        detail: `coverage_requirements.csv requires ${requirement.shiftCode} at ${requirement.siteCode} on ${friendlyDate(requirement.shiftDate)}, but the draft schedule has no matching row (not even an unfilled one).`,
        evidence: { requirement },
        suggestedAction: 'Add this shift to the schedule and assign a covering provider.',
      });
    } else if (entries.length === 1 && entries[0].providerId === null) {
      findings.push({
        id: nextId('H1'),
        severity: 'HARD',
        rule: 'H1',
        ruleName: 'Every required shift covered by exactly one provider',
        providerId: null,
        providerName: null,
        siteCode: requirement.siteCode,
        shiftDate: requirement.shiftDate,
        shiftCode: requirement.shiftCode,
        summary: `${requirement.shiftCode} on ${friendlyDate(requirement.shiftDate)} is unfilled`,
        detail: `This required shift appears in the draft schedule with no provider assigned.`,
        evidence: { requirement, scheduleRow: entries[0] },
        suggestedAction: 'Assign a credentialed, eligible provider to this shift before publishing.',
      });
    } else if (entries.length > 1) {
      findings.push({
        id: nextId('H1'),
        severity: 'HARD',
        rule: 'H1',
        ruleName: 'Every required shift covered by exactly one provider',
        providerId: null,
        providerName: null,
        siteCode: requirement.siteCode,
        shiftDate: requirement.shiftDate,
        shiftCode: requirement.shiftCode,
        summary: `${requirement.shiftCode} on ${friendlyDate(requirement.shiftDate)} has ${entries.length} providers assigned to one required slot`,
        detail: `Providers assigned: ${entries.map((entry) => entry.providerId ?? 'unfilled').join(', ')}. Only 1 is required.`,
        evidence: { requirement, scheduleRows: entries },
        suggestedAction: 'Remove the extra assignment(s) so exactly one provider covers this shift.',
      });
    }
  }

  for (const entry of data.schedule) {
    if (!coverageKeys.has(entry.key)) {
      findings.push({
        id: nextId('H1'),
        severity: 'HARD',
        rule: 'H1',
        ruleName: 'Every required shift covered by exactly one provider',
        providerId: entry.providerId,
        providerName: entry.providerNameRaw,
        siteCode: entry.siteCode,
        shiftDate: entry.shiftDate,
        shiftCode: entry.shiftCode,
        summary: `Scheduled shift ${entry.shiftCode} on ${friendlyDate(entry.shiftDate)} isn't in coverage_requirements.csv`,
        detail: `The draft schedule assigns ${entry.providerId ?? 'no one'} to a shift that coverage_requirements.csv never asked for.`,
        evidence: { scheduleRow: entry },
        suggestedAction: 'Confirm whether this shift is actually needed; remove it or add it to requirements.',
      });
    }
  }

  return findings;
}

// H2 — site credentialing
function checkH2(data: RawData, providersById: Map<string, Provider>): Finding[] {
  const findings: Finding[] = [];
  for (const entry of data.schedule) {
    if (!entry.providerId) continue;
    const provider = providersById.get(entry.providerId);
    if (!provider) continue;
    if (!provider.credentialedSites.includes(entry.siteCode)) {
      findings.push({
        id: nextId('H2'),
        severity: 'HARD',
        rule: 'H2',
        ruleName: 'Provider works only at sites they are credentialed for',
        providerId: entry.providerId,
        providerName: provider.name,
        siteCode: entry.siteCode,
        shiftDate: entry.shiftDate,
        shiftCode: entry.shiftCode,
        summary: `${providerLabel(provider, entry.providerId)} is scheduled at ${entry.siteCode} but is only credentialed for ${provider.credentialedSites.join(', ') || 'no site'}`,
        detail: `${entry.shiftCode} on ${friendlyDate(entry.shiftDate)}.`,
        evidence: { scheduleRow: entry, credentialedSites: provider.credentialedSites },
        suggestedAction: 'Reassign this shift to a provider credentialed for this site.',
      });
    }
  }
  return findings;
}

// H3 — night eligibility / PA restriction
function checkH3(data: RawData, providersById: Map<string, Provider>): Finding[] {
  const findings: Finding[] = [];
  for (const entry of data.schedule) {
    if (!entry.providerId || !entry.isNight) continue;
    const provider = providersById.get(entry.providerId);
    if (!provider) continue;
    const reasons: string[] = [];
    if (!provider.nightEligible) reasons.push('not marked night_eligible on the roster');
    if (provider.role === 'PA') reasons.push('PAs do not work nights, regardless of the night_eligible flag');
    if (reasons.length > 0) {
      findings.push({
        id: nextId('H3'),
        severity: 'HARD',
        rule: 'H3',
        ruleName: 'Night shifts worked only by night-eligible providers; PAs never work nights',
        providerId: entry.providerId,
        providerName: provider.name,
        siteCode: entry.siteCode,
        shiftDate: entry.shiftDate,
        shiftCode: entry.shiftCode,
        summary: `${providerLabel(provider, entry.providerId)} is scheduled for a night shift (${entry.shiftCode}) on ${friendlyDate(entry.shiftDate)}: ${reasons.join('; ')}`,
        detail: `Role: ${provider.role}, night_eligible: ${provider.nightEligible ? 'Y' : 'N'}.`,
        evidence: { scheduleRow: entry, role: provider.role, nightEligible: provider.nightEligible },
        suggestedAction: 'Reassign this night shift to an eligible physician.',
      });
    }
  }
  return findings;
}

// H4 — no overlapping shifts, no two shifts starting the same calendar day
function checkH4(scheduleByProvider: Map<string, ScheduleEntry[]>, providersById: Map<string, Provider>): Finding[] {
  const findings: Finding[] = [];
  for (const [providerId, entries] of scheduleByProvider) {
    const provider = providersById.get(providerId);
    for (let outerIndex = 0; outerIndex < entries.length; outerIndex++) {
      for (let innerIndex = outerIndex + 1; innerIndex < entries.length; innerIndex++) {
        const firstShift = entries[outerIndex];
        const secondShift = entries[innerIndex];
        const sameDay = firstShift.shiftDate === secondShift.shiftDate;
        const overlaps = firstShift.startDateTime.getTime() < secondShift.endDateTime.getTime() && secondShift.startDateTime.getTime() < firstShift.endDateTime.getTime();
        if (sameDay || overlaps) {
          const reasons: string[] = [];
          if (sameDay) reasons.push('both begin on the same calendar day');
          if (overlaps) reasons.push('their times overlap');
          findings.push({
            id: nextId('H4'),
            severity: 'HARD',
            rule: 'H4',
            ruleName: 'No overlapping shifts or two shifts starting the same day',
            providerId,
            providerName: provider?.name ?? null,
            siteCode: firstShift.siteCode,
            shiftDate: firstShift.shiftDate,
            shiftCode: firstShift.shiftCode,
            summary: `${providerLabel(provider, providerId)} is double-booked: ${firstShift.shiftCode} on ${friendlyDate(firstShift.shiftDate)} and ${secondShift.shiftCode} on ${friendlyDate(secondShift.shiftDate)} (${reasons.join(' and ')})`,
            detail: `${firstShift.shiftCode} runs ${friendlyTime(firstShift.startTime)} to ${friendlyTime(firstShift.endTime)} on ${friendlyDate(firstShift.shiftDate)}, and ${secondShift.shiftCode} runs ${friendlyTime(secondShift.startTime)} to ${friendlyTime(secondShift.endTime)} on ${friendlyDate(secondShift.shiftDate)}.`,
            evidence: { shiftA: firstShift, shiftB: secondShift },
            suggestedAction: 'Remove one of these two assignments and find coverage for whichever shift is dropped.',
          });
        }
      }
    }
  }
  return findings;
}

// H5 — minimum 10 hours off between shifts
function checkH5(scheduleByProvider: Map<string, ScheduleEntry[]>, providersById: Map<string, Provider>): Finding[] {
  const findings: Finding[] = [];
  for (const [providerId, entries] of scheduleByProvider) {
    const provider = providersById.get(providerId);
    for (let shiftIndex = 0; shiftIndex < entries.length - 1; shiftIndex++) {
      const firstShift = entries[shiftIndex];
      const secondShift = entries[shiftIndex + 1];
      const gap = diffHours(firstShift.endDateTime, secondShift.startDateTime);
      if (gap < 0) continue; // overlap, already reported under H4
      if (gap < 10) {
        findings.push({
          id: nextId('H5'),
          severity: 'HARD',
          rule: 'H5',
          ruleName: 'Minimum 10 hours off between shifts',
          providerId,
          providerName: provider?.name ?? null,
          siteCode: secondShift.siteCode,
          shiftDate: secondShift.shiftDate,
          shiftCode: secondShift.shiftCode,
          summary: `${providerLabel(provider, providerId)} only gets ${gap.toFixed(1)} hours of rest between shifts on ${friendlyDate(firstShift.shiftDate)} and ${friendlyDate(secondShift.shiftDate)}`,
          detail: `${firstShift.shiftCode} ends at ${friendlyTime(firstShift.endTime)} on ${friendlyDate(firstShift.shiftDate)}, and ${secondShift.shiftCode} starts at ${friendlyTime(secondShift.startTime)} on ${friendlyDate(secondShift.shiftDate)}. That leaves ${gap.toFixed(1)} hours of rest; the minimum is 10.`,
          evidence: { shiftA: firstShift, shiftB: secondShift, gapHours: gap },
          suggestedAction: 'Push the second shift later or reassign it to give this provider a full rest period.',
        });
      }
    }
  }
  return findings;
}

// H6 — no more than 3 consecutive night shifts
function checkH6(scheduleByProvider: Map<string, ScheduleEntry[]>, providersById: Map<string, Provider>): Finding[] {
  const findings: Finding[] = [];
  for (const [providerId, entries] of scheduleByProvider) {
    const provider = providersById.get(providerId);
    for (const run of nightRuns(entries)) {
      if (run.length > 3) {
        findings.push({
          id: nextId('H6'),
          severity: 'HARD',
          rule: 'H6',
          ruleName: 'No more than 3 consecutive night shifts',
          providerId,
          providerName: provider?.name ?? null,
          siteCode: run[0].siteCode,
          shiftDate: run[0].shiftDate,
          shiftCode: run[0].shiftCode,
          summary: `${providerLabel(provider, providerId)} works ${run.length} nights in a row, from ${friendlyDate(run[0].shiftDate)} through ${friendlyDate(run[run.length - 1].shiftDate)}`,
          detail: `Nights: ${run.map((night) => `${friendlyDate(night.shiftDate)} (${night.shiftCode})`).join(', ')}. The cap is 3 nights in a row.`,
          evidence: { run },
          suggestedAction: `Break this run after 3 nights; reassign the remaining ${run.length - 3} night shift(s) to someone else.`,
        });
      }
    }
  }
  return findings;
}

// H7 — no shift inside approved leave
function checkH7(data: RawData, providersById: Map<string, Provider>): Finding[] {
  const findings: Finding[] = [];
  const leaveByProvider = new Map<string, ApprovedLeave[]>();
  for (const leaveRecord of data.leave) {
    const leaveRecords = leaveByProvider.get(leaveRecord.providerId) ?? [];
    leaveRecords.push(leaveRecord);
    leaveByProvider.set(leaveRecord.providerId, leaveRecords);
  }
  for (const entry of data.schedule) {
    if (!entry.providerId) continue;
    const leaveRecords = leaveByProvider.get(entry.providerId) ?? [];
    for (const leaveRecord of leaveRecords) {
      if (entry.shiftDate >= leaveRecord.leaveStart && entry.shiftDate <= leaveRecord.leaveEnd) {
        const provider = providersById.get(entry.providerId);
        findings.push({
          id: nextId('H7'),
          severity: 'HARD',
          rule: 'H7',
          ruleName: 'No shift during approved leave',
          providerId: entry.providerId,
          providerName: provider?.name ?? null,
          siteCode: entry.siteCode,
          shiftDate: entry.shiftDate,
          shiftCode: entry.shiftCode,
          summary: `${providerLabel(provider, entry.providerId)} is scheduled for ${entry.shiftCode} on ${friendlyDate(entry.shiftDate)}, inside their approved ${leaveRecord.leaveType} (${friendlyDate(leaveRecord.leaveStart)} to ${friendlyDate(leaveRecord.leaveEnd)})`,
          detail: `Approved leave window: ${friendlyDate(leaveRecord.leaveStart)} to ${friendlyDate(leaveRecord.leaveEnd)} (${leaveRecord.leaveType}).`,
          evidence: { scheduleRow: entry, leave: leaveRecord },
          suggestedAction: 'Remove this shift from the provider and reassign coverage.',
        });
      }
    }
  }
  return findings;
}

// H8 — assigned load within target band
function checkH8(providers: Provider[], scheduleByProvider: Map<string, ScheduleEntry[]>): Finding[] {
  const findings: Finding[] = [];
  for (const provider of providers) {
    const entries = scheduleByProvider.get(provider.providerId) ?? [];
    if (provider.targetType === null || provider.targetValue === null) {
      findings.push({
        id: nextId('H8'),
        severity: 'DATA_ISSUE',
        rule: 'H8',
        ruleName: "Assigned load within target band (can't be checked: target missing)",
        providerId: provider.providerId,
        providerName: provider.name,
        siteCode: null,
        shiftDate: null,
        shiftCode: null,
        summary: `${provider.name} (${provider.providerId}) has no load target on the roster, so H8 can't be evaluated`,
        detail: `providers.csv has no target_type/target_value for this provider. They are currently assigned ${entries.length} shifts, but there's nothing to compare that against.`,
        evidence: { assignedShiftCount: entries.length },
        suggestedAction: 'Get a load target from the roster owner before this schedule can be signed off for this provider.',
      });
      continue;
    }
    if (provider.targetType === 'SHIFTS') {
      const count = entries.length;
      const low = provider.targetValue - 1;
      const high = provider.targetValue + 1;
      if (count < low || count > high) {
        findings.push(loadFinding(provider, count, low, high, `${count} shifts`, `${provider.targetValue} ± 1 shift`));
      }
    } else {
      const hours = entries.reduce((sum, entry) => sum + entry.durationHours, 0);
      const low = provider.targetValue - 8;
      const high = provider.targetValue + 8;
      if (hours < low || hours > high) {
        findings.push(loadFinding(provider, hours, low, high, `${hours}h`, `${provider.targetValue}h ± 8h`));
      }
    }
  }
  return findings;

  function loadFinding(provider: Provider, actual: number, low: number, high: number, actualLabel: string, bandLabel: string): Finding {
    const direction = actual > high ? 'over' : 'under';
    return {
      id: nextId('H8'),
      severity: 'HARD',
      rule: 'H8',
      ruleName: 'Assigned load within target band',
      providerId: provider.providerId,
      providerName: provider.name,
      siteCode: null,
      shiftDate: null,
      shiftCode: null,
      summary: `${provider.name} (${provider.providerId}) is ${direction} target: ${actualLabel} assigned, band is ${bandLabel}`,
      detail: `Target type: ${provider.targetType}. Allowed range: ${low} to ${high}.`,
      evidence: { actual, low, high, targetType: provider.targetType, targetValue: provider.targetValue },
      suggestedAction: direction === 'over'
        ? 'Move some of this provider’s shifts to someone under target.'
        : 'Add shifts for this provider, or confirm the target is still correct.',
    };
  }
}

// H9 — minimum 12 shifts per period
function checkH9(providers: Provider[], scheduleByProvider: Map<string, ScheduleEntry[]>): Finding[] {
  const findings: Finding[] = [];
  for (const provider of providers) {
    const count = (scheduleByProvider.get(provider.providerId) ?? []).length;
    if (count < 12) {
      findings.push({
        id: nextId('H9'),
        severity: 'HARD',
        rule: 'H9',
        ruleName: 'Minimum 12 shifts per period (benefits eligibility floor)',
        providerId: provider.providerId,
        providerName: provider.name,
        siteCode: null,
        shiftDate: null,
        shiftCode: null,
        summary: `${provider.name} (${provider.providerId}) has only ${count} shifts this period; floor is 12`,
        detail: `This is a benefits eligibility floor and applies regardless of this provider's target type.`,
        evidence: { assignedShiftCount: count },
        suggestedAction: 'Add shifts to bring this provider up to at least 12.',
      });
    }
  }
  return findings;
}
