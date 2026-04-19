export default function MatchMap({ perRequirement }) {
  if (!perRequirement || perRequirement.length === 0) return null;

  const getMatchConfig = (type) => {
    if (type === 'direct')   return { color: '#16a34a', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  label: 'Direct',   dot: '#16a34a' };
    if (type === 'inferred') return { color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Inferred', dot: '#d97706' };
    return                          { color: '#ef4444', bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.15)', label: 'Missing',  dot: '#ef4444' };
  };

  const totalWeight = perRequirement.reduce((s, r) => s + r.base_weight, 0);

  return (
    <div className="ste-matchmap">

      {/* Legend */}
      <div className="ste-matchmap-legend">
        {['direct', 'inferred', 'missing'].map(t => {
          const c = getMatchConfig(t);
          const count = perRequirement.filter(r => r.match_type === t).length;
          return (
            <div key={t} className="ste-legend-item">
              <span className="ste-legend-dot" style={{ background: c.dot }} />
              <span className="ste-legend-label">{c.label}</span>
              <span className="ste-legend-count" style={{ color: c.color }}>{count}</span>
            </div>
          );
        })}
        <div className="ste-legend-sep" />
        <div className="ste-legend-item">
          <span className="ste-legend-label">Requirements</span>
          <span className="ste-legend-count">{perRequirement.length}</span>
        </div>
      </div>

      {/* Requirement rows */}
      <div className="ste-matchmap-rows">
        {perRequirement.map((req, idx) => {
          const mc = getMatchConfig(req.match_type);
          const weightPct = totalWeight > 0 ? (req.base_weight / totalWeight) * 100 : 0;

          return (
            <div
              key={idx}
              className="ste-matchmap-row"
              style={{ borderLeftColor: mc.dot }}
            >
              {/* Left: Requirement info */}
              <div className="ste-matchmap-left">
                <div className="ste-req-label">{req.requirement_label}</div>
                <div className="ste-req-meta">
                  <span
                    className="ste-req-match-badge"
                    style={{ color: mc.color, background: mc.bg, border: `1px solid ${mc.border}` }}
                  >
                    {mc.label}
                  </span>
                  {req.priority === 'must_have' ? (
                    <span className="ste-req-priority must">Must Have</span>
                  ) : (
                    <span className="ste-req-priority nice">Nice to Have</span>
                  )}
                </div>
              </div>

              {/* Center: Evidence */}
              <div className="ste-matchmap-evidence">
                {req.match_type !== 'missing' ? (
                  <p className="ste-evidence-text">{req.evidence}</p>
                ) : (
                  <p className="ste-evidence-missing">Not found in candidate profile</p>
                )}
              </div>

              {/* Right: Weight */}
              <div className="ste-matchmap-weight">
                <div className="ste-weight-score">
                  {req.weighted_score.toFixed(2)}
                  <span className="ste-weight-unit">pts</span>
                </div>
                <div className="ste-weight-bar-track">
                  <div
                    className="ste-weight-bar-fill"
                    style={{ width: `${Math.min(100, weightPct * 2)}%`, background: mc.dot }}
                  />
                </div>
                <div className="ste-weight-base">w: {req.base_weight.toFixed(1)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .ste-matchmap {
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        /* Legend */
        .ste-matchmap-legend {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.625rem 0.875rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 0.625rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .ste-legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .ste-legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ste-legend-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .ste-legend-count {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .ste-legend-sep {
          width: 1px;
          height: 14px;
          background: var(--border-subtle);
          margin: 0 0.125rem;
        }

        /* Rows */
        .ste-matchmap-rows {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .ste-matchmap-row {
          display: grid;
          grid-template-columns: 200px 1fr 100px;
          gap: 0;
          border-bottom: 1px solid var(--border-subtle);
          border-left: 3px solid transparent;
          transition: background 0.12s;
        }
        .ste-matchmap-row:last-child { border-bottom: none; }
        .ste-matchmap-row:hover { background: rgba(135,163,48,0.02); }

        .ste-matchmap-left {
          padding: 0.75rem 0.875rem;
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          justify-content: center;
        }
        .ste-req-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .ste-req-meta { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
        .ste-req-match-badge {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
        .ste-req-priority {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .ste-req-priority.must { color: var(--text-primary); }
        .ste-req-priority.nice { color: var(--text-muted); }

        .ste-matchmap-evidence {
          padding: 0.75rem 0.875rem;
          display: flex;
          align-items: center;
          border-right: 1px solid var(--border-subtle);
        }
        .ste-evidence-text {
          font-size: 0.775rem;
          line-height: 1.55;
          color: var(--text-secondary);
          margin: 0;
        }
        .ste-evidence-missing {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
        }

        .ste-matchmap-weight {
          padding: 0.75rem 0.875rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
        }
        .ste-weight-score {
          font-size: 0.9375rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          line-height: 1;
        }
        .ste-weight-unit {
          font-size: 0.62rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-left: 1px;
        }
        .ste-weight-bar-track {
          width: 56px;
          height: 3px;
          background: var(--border-subtle);
          border-radius: 999px;
          overflow: hidden;
        }
        .ste-weight-bar-fill {
          height: 100%;
          border-radius: 999px;
          opacity: 0.7;
          transition: width 0.6s ease;
        }
        .ste-weight-base {
          font-size: 0.62rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .ste-matchmap-row { grid-template-columns: 1fr; }
          .ste-matchmap-left, .ste-matchmap-evidence { border-right: none; border-bottom: 1px solid var(--border-subtle); }
          .ste-matchmap-weight { align-items: flex-start; padding-top: 0.5rem; }
        }
      `}</style>
    </div>
  );
}