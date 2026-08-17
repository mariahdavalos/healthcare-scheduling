import type { Finding } from '../types';

export function DataNotes({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;
  return (
    <details className="data-notes">
      <summary>Notes</summary>
      {findings.map((finding) => (
        <div key={finding.id} className="data-note">
          <div className="msg">{finding.summary}</div>
          <div className="src">{finding.detail}</div>
        </div>
      ))}
    </details>
  );
}
