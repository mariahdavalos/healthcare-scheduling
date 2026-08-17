import type { Finding } from '../types';

export function GapSection({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;
  return (
    <div>
      <p className="section-head">Unassigned </p>
      {findings.map((finding) => (
        <div key={finding.id} className="gapcard">
          <div className="txt">
            <strong>{finding.summary}</strong>
            <span>{finding.suggestedAction}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
