export default function MatchMap({ perRequirement }) {
  if (!perRequirement || perRequirement.length === 0) return null;

  return (
    <div className="w-full bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Type</th>
            <th>Priority</th>
            <th className="text-right">Weight</th>
            <th>Evidence (Zero LLM)</th>
          </tr>
        </thead>
        <tbody>
          {perRequirement.map((req, idx) => {
            let rowClass = 'row-missing';
            let icon = '❌';
            if (req.match_type === 'direct') {
              rowClass = 'row-direct';
              icon = '✅';
            } else if (req.match_type === 'inferred') {
              rowClass = 'row-inferred';
              icon = '🔍';
            }

            return (
              <tr key={idx} className={rowClass}>
                <td className="font-medium text-[var(--text-primary)]">
                  {req.requirement_label}
                </td>
                <td>
                  <span className={`badge ${
                    req.match_type === 'direct' ? 'badge-green' : 
                    req.match_type === 'inferred' ? 'badge-amber' : 'badge-red'
                  }`}>
                    {req.match_type.toUpperCase()}
                  </span>
                </td>
                <td>
                  {req.priority === 'must_have' ? (
                     <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">Must Have</span>
                  ) : (
                     <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Nice to Have</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="text-xs text-[var(--text-secondary)]">Base: {req.base_weight.toFixed(1)}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Total: {req.weighted_score.toFixed(2)}</div>
                </td>
                <td className="text-[var(--text-primary)] text-sm max-w-md">
                  <div className="flex gap-2 items-start">
                    <span className="opacity-80 flex-shrink-0 mt-0.5">{icon}</span>
                    <span className="leading-relaxed opacity-90">{req.evidence}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
