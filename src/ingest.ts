import * as path from 'path';
import * as XLSX from 'xlsx';
import {
  ApprovedLeave,
  CoverageRequirement,
  Preference,
  Provider,
  RawData,
  Role,
  ScheduleEntry,
  TargetType,
} from './types';
import { addDaysISO, diffHours, excelFractionToTime, excelSerialToISODate, isoToUTCDate } from './dateUtils';

function readSheet(filePath: string): Record<string, unknown>[] {
  const workbook = XLSX.readFile(filePath, { raw: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: true });
}

function shiftKey(shiftDate: string, siteCode: string, shiftCode: string): string {
  return `${shiftDate}|${siteCode}|${shiftCode}`;
}

export interface IngestWarning {
  file: string;
  message: string;
}

export interface IngestResult {
  data: RawData;
  warnings: IngestWarning[];
}

export function ingest(dataDir: string): IngestResult {
  const warnings: IngestWarning[] = [];

  const providerRows = readSheet(path.join(dataDir, 'providers.xlsx'));
  const providers: Provider[] = providerRows.map((row) => {
    const targetTypeRaw = row.target_type as string | null;
    const targetType: TargetType | null =
      targetTypeRaw === 'SHIFTS' || targetTypeRaw === 'HOURS' ? targetTypeRaw : null;
    const targetValue = typeof row.target_value === 'number' ? row.target_value : null;
    if (targetType === null || targetValue === null) {
      warnings.push({
        file: 'providers.xlsx',
        message: `${row.provider_id} (${row.provider_name}) is missing a load target (target_type/target_value). Load-band checks cannot run for this provider.`,
      });
    }
    return {
      providerId: String(row.provider_id),
      name: String(row.provider_name),
      role: row.role as Role,
      targetType,
      targetValue,
      credentialedSites: String(row.credentialed_sites ?? '')
        .split('|')
        .map((site) => site.trim())
        .filter(Boolean),
      nightEligible: row.night_eligible === 'Y',
    };
  });

  const coverageRows = readSheet(path.join(dataDir, 'coverage_requirements.xlsx'));
  const coverage: CoverageRequirement[] = coverageRows.map((row) => {
    const shiftDate = excelSerialToISODate(row.shift_date as number);
    const startTime = excelFractionToTime(row.start_time as number);
    const endTime = excelFractionToTime(row.end_time as number);
    const siteCode = String(row.site_code);
    const shiftCode = String(row.shift_code);
    return {
      key: shiftKey(shiftDate, siteCode, shiftCode),
      shiftDate,
      siteCode,
      shiftCode,
      startTime,
      endTime,
      providersRequired: Number(row.providers_required ?? 1),
    };
  });

  const leaveRows = readSheet(path.join(dataDir, 'approved_leave.xlsx'));
  const leave: ApprovedLeave[] = leaveRows.map((row) => ({
    providerId: String(row.provider_id),
    leaveStart: excelSerialToISODate(row.leave_start as number),
    leaveEnd: excelSerialToISODate(row.leave_end as number),
    leaveType: String(row.leave_type ?? ''),
  }));

  const preferenceRows = readSheet(path.join(dataDir, 'preferences.xlsx'));
  const preferences: Preference[] = preferenceRows.map((row) => ({
    providerId: String(row.provider_id),
    providerNameRaw: String(row.provider_name ?? ''),
    appliesToRaw:
      typeof row.applies_to === 'number' ? excelSerialToISODate(row.applies_to) : String(row.applies_to ?? ''),
    priority: row.priority as Preference['priority'],
    note: String(row.note ?? ''),
  }));

  const scheduleRows = readSheet(path.join(dataDir, 'draft_schedule.xlsx'));
  const schedule: ScheduleEntry[] = scheduleRows.map((row) => {
    const shiftDate = excelSerialToISODate(row.shift_date as number);
    const startTime = excelFractionToTime(row.start_time as number);
    const endTime = excelFractionToTime(row.end_time as number);
    const siteCode = String(row.site_code);
    const shiftCode = String(row.shift_code);
    const startDateTime = isoToUTCDate(shiftDate, startTime);
    const crossesMidnight = endTime <= startTime;
    const endDateTime = isoToUTCDate(
      crossesMidnight ? addDaysISO(shiftDate, 1) : shiftDate,
      endTime
    );
    const providerId = row.provider_id === null || row.provider_id === undefined ? null : String(row.provider_id);
    return {
      key: shiftKey(shiftDate, siteCode, shiftCode),
      shiftDate,
      siteCode,
      shiftCode,
      startTime,
      endTime,
      providerId,
      providerNameRaw: row.provider_name === null || row.provider_name === undefined ? null : String(row.provider_name),
      startDateTime,
      endDateTime,
      isNight: shiftCode.endsWith('-N'),
      durationHours: diffHours(startDateTime, endDateTime),
    };
  });

  const rosterById = new Map(providers.map((provider) => [provider.providerId, provider]));
  const normalizeNameTokens = (name: string) =>
    name
      .toLowerCase()
      .replace(/[.,]/g, '')
      .split(/\s+/)
      .filter((token) => token && token !== 'dr')
      .sort()
      .join(' ');
  for (const preference of preferences) {
    const roster = rosterById.get(preference.providerId);
    if (roster && normalizeNameTokens(roster.name) !== normalizeNameTokens(preference.providerNameRaw)) {
      warnings.push({
        file: 'preferences.xlsx',
        message: `${preference.providerId} is listed as "${preference.providerNameRaw}" here but "${roster.name}" on the roster. Matched by provider_id; please confirm this is the same person.`,
      });
    }
  }

  return {
    data: { providers, coverage, leave, preferences, schedule },
    warnings,
  };
}
