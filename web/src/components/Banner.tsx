import type { AuditResult } from '../types';

/** Turns "2026-09-01 to 2026-09-30" into "September 1 – 30, 2026" (or a two-month range if it spans months). */
function formatPeriod(schedulingPeriod: string): string {
  const [startRaw, endRaw] = schedulingPeriod.split(' to ');
  const start = new Date(`${startRaw}T00:00:00`);
  const end = new Date(`${endRaw}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return schedulingPeriod;

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const month = (date: Date) => date.toLocaleDateString(undefined, { month: 'long' });
  const short = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (sameMonth) {
    return `${month(start)} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${short(start)} – ${short(end)}, ${end.getFullYear()}`;
}

const META_STATS = (meta: AuditResult['meta']) => [
  { icon: '👥', value: meta.providerCount.toLocaleString(), label: meta.providerCount === 1 ? 'Provider' : 'Providers' },
  { icon: '🏥', value: meta.siteCount.toLocaleString(), label: meta.siteCount === 1 ? 'Site' : 'Sites' },
  { icon: '🗓️', value: meta.shiftCount.toLocaleString(), label: 'Shifts' },
  { icon: '⏱️', value: meta.totalHours.toLocaleString(), label: 'Hours' },
];

export function Banner({ data }: { data: AuditResult }) {
  const { meta, publishable, summary } = data;

  const subtext = publishable
    ? summary.softFindingCount > 0
      ? `No hard-rule violations. ${summary.softFindingCount} preference/fairness items below are worth a look before you send it out.`
      : 'No issues found.'
    : `${summary.hardViolationCount} shift${summary.hardViolationCount === 1 ? '' : 's'} with critical issues. \n ${summary.softFindingCount} soft violations need review.`;

  const generated = new Date(meta.generatedAt).toLocaleString();

  return (
    <div className="banner">
      <div className="banner-inner">
       <p className="eyebrow">Scheduling for {formatPeriod(meta.schedulingPeriod)}</p>
        <details className="meta-details">
          <summary>Providers, sites, shifts, and hours</summary>
          <div className="meta-stats">
            {META_STATS(meta).map((stat) => (
              <div className="meta-stat" key={stat.label}>
                <span className="meta-stat-icon" aria-hidden="true">{stat.icon}</span>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
        <div className="verdict">
          <span className={`verdict-badge ${publishable ? 'ready' : 'not-ready'}`}>
            {publishable ? 'Ready to publish' : 'Not ready to publish'}
          </span>
        </div>
        <p className="verdict-sub">{subtext}</p>
        <p className="verdict-meta">
          Last audited  {generated}
        </p>

      </div>
    </div>
  );
}
