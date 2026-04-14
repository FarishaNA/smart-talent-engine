import { Link } from 'react-router-dom';

export default function CandidateRow({
  candidate,
  index,
  isSelected,
  onSelectToggle,
  showSelectBox,
  jobId: passedJobId
}) {
  const activeJobId = passedJobId || candidate.job_id;

  const getScoreColor = (score) => {
    if (score >= 70) return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)' };
    if (score >= 45) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' };
    return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
  };

  const getRankStyle = (i) => {
    if (i === 0) return { color: '#d97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.25)' };
    if (i === 1) return { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' };
    if (i === 2) return { color: '#92400e', bg: 'rgba(146,64,14,0.08)', border: 'rgba(146,64,14,0.2)' };
    return { color: 'var(--text-muted,#999)', bg: 'transparent', border: 'var(--border-subtle)' };
  };

  const getConfColor = (level) => {
    if (level === 'high') return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' };
    if (level === 'medium') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
    return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
  };

  const sc = getScoreColor(candidate.compatibility_score);
  const rk = getRankStyle(index);
  const cc = getConfColor(candidate.confidence_level);
  const scoreInt = Math.round(candidate.compatibility_score);

  return (
    <>
      <tr className="ste-row">
        {/* Checkbox */}
        {showSelectBox && (
          <td style={{ width: 44, textAlign: 'center', paddingLeft: '0.75rem' }} onClick={e => e.stopPropagation()}>
            <div
              className={`ste-checkbox ${isSelected ? 'checked' : ''}`}
              onClick={() => onSelectToggle(candidate.candidate_id)}
            >
              {isSelected && (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="white">
                  <path d="M4.5 9L1.5 6L2.5 5L4.5 7L9.5 2L10.5 3L4.5 9Z" />
                </svg>
              )}
            </div>
          </td>
        )}

        {/* Rank */}
        <td style={{ width: 48, paddingLeft: '0.75rem' }}>
          <div className="ste-rank-badge" style={{
            color: rk.color, background: rk.bg, border: `1px solid ${rk.border}`
          }}>
            {index + 1}
          </div>
        </td>

        {/* Candidate Name + Meta */}
        <td style={{ padding: '0.875rem 1rem' }}>
          <Link
            to={`/candidates/${candidate.candidate_id}?job=${activeJobId}`}
            className="ste-candidate-name"
          >
            {candidate.name}
          </Link>
          <div className="ste-candidate-meta">
            <span className="ste-conf-badge" style={{ color: cc.color, background: cc.bg }}>
              {candidate.confidence_level}
            </span>
            {candidate.hiring_profile && (
              <span className="ste-profile-badge">{candidate.hiring_profile.label}</span>
            )}
          </div>
        </td>

        {/* Score */}
        <td style={{ padding: '0.875rem 0.75rem' }}>
          <div className="ste-score-cell">
            <div className="ste-score-pill" style={{
              color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`
            }}>
              {scoreInt}%
            </div>
            <div className="ste-score-bar-track">
              <div className="ste-score-bar-fill" style={{
                width: `${scoreInt}%`, background: sc.color, opacity: 0.5
              }} />
            </div>
          </div>
        </td>

        {/* Top Skills */}
        <td style={{ padding: '0.875rem 0.75rem', maxWidth: 240 }}>
          <div className="ste-skills-list">
            {candidate.direct_matches.slice(0, 3).map((m, i) => (
              <span key={`d-${i}`} className="ste-skill-tag">{m.label}</span>
            ))}
            {candidate.inferred_matches.slice(0, Math.max(0, 3 - candidate.direct_matches.length)).map((m, i) => (
              <span key={`i-${i}`} className="ste-skill-tag inferred" title={`Inferred via ${m.matched_via}`}>
                {m.label}<span style={{ opacity: 0.5, marginLeft: 2 }}>*</span>
              </span>
            ))}
            {(candidate.direct_matches.length + candidate.inferred_matches.length > 3) && (
              <span className="ste-skill-more">
                +{candidate.direct_matches.length + candidate.inferred_matches.length - 3}
              </span>
            )}
          </div>
        </td>

        {/* Pipeline */}
        <td style={{ padding: '0.875rem 0.75rem', width: 110 }}>
          <div className="ste-pipeline-flags">
            {candidate.retrieval_method === 'rag_retrieved' && (
              <span className="ste-pipe-tag blue">RAG</span>
            )}
            {candidate.llm_reranked && (
              <span className="ste-pipe-tag green">Re-ranked</span>
            )}
          </div>
        </td>

        {/* Flags */}
        <td style={{ padding: '0.875rem 0.75rem', width: 100 }}>
          <div className="ste-flag-list">
            {candidate.hidden_gem_flag && (
              <span className="ste-flag-tag gem" title={candidate.hidden_gem_type?.replace('_', ' ')}>
                ✦ Gem
              </span>
            )}
            {candidate.keyword_stuffing_flag && (
              <span className="ste-flag-tag red">⚠ Stuffed</span>
            )}
          </div>
        </td>

        {/* Summary */}
        <td style={{ padding: '0.875rem 0.75rem', maxWidth: 260 }}>
          <p className="ste-summary-text">
            {candidate.justification.split('.')[0]}.{' '}
            <Link to={`/candidates/${candidate.candidate_id}?job=${activeJobId}`} className="ste-read-more">
              More →
            </Link>
          </p>
        </td>

        {/* Action */}
        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
          <Link
            to={`/candidates/${candidate.candidate_id}?job=${activeJobId}`}
            className="ste-deep-dive-btn"
          >
            Deep Dive
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </td>
      </tr>

      <style>{`
        .ste-row {
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.12s;
        }
        .ste-row:last-child { border-bottom: none; }
        .ste-row:hover { background: rgba(135,163,48,0.025); }
        .ste-row:hover .ste-deep-dive-btn { opacity: 1; transform: none; }

        .ste-checkbox {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid var(--border-subtle);
          background: var(--bg-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; margin: 0 auto;
        }
        .ste-checkbox.checked {
          background: var(--accent-indigo); border-color: var(--accent-indigo);
        }
        .ste-checkbox:hover { border-color: var(--accent-indigo); }

        .ste-rank-badge {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; letter-spacing: -0.01em;
        }

        .ste-candidate-name {
          display: block; font-size: 0.875rem; font-weight: 700;
          color: var(--text-primary); text-decoration: none; margin-bottom: 0.3rem;
          letter-spacing: -0.01em; transition: color 0.12s;
        }
        .ste-candidate-name:hover { color: var(--accent-indigo); }

        .ste-candidate-meta { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
        .ste-conf-badge {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 4px;
        }
        .ste-profile-badge {
          font-size: 0.65rem; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 4px;
          background: var(--bg-secondary); color: var(--text-muted,#999);
          border: 1px solid var(--border-subtle);
        }

        .ste-score-cell { display: flex; flex-direction: column; gap: 0.35rem; min-width: 68px; }
        .ste-score-pill {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0.25rem 0.6rem; border-radius: 6px;
          font-size: 0.8125rem; font-weight: 800; letter-spacing: -0.01em;
          width: fit-content;
        }
        .ste-score-bar-track {
          height: 3px; border-radius: 99px; background: var(--border-subtle);
          overflow: hidden; width: 100%;
        }
        .ste-score-bar-fill {
          height: 100%; border-radius: 99px; transition: width 0.6s ease;
        }

        .ste-skills-list { display: flex; flex-wrap: wrap; gap: 0.3rem; }
        .ste-skill-tag {
          font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 5px;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          color: var(--text-secondary, #555); white-space: nowrap;
        }
        .ste-skill-tag.inferred {
          background: rgba(135,163,48,0.08); border-color: rgba(135,163,48,0.25);
          color: var(--accent-indigo);
        }
        .ste-skill-more {
          font-size: 0.7rem; color: var(--text-muted,#999); padding: 0.2rem 0.25rem;
          align-self: center;
        }

        .ste-pipeline-flags { display: flex; flex-direction: column; gap: 0.3rem; }
        .ste-pipe-tag {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 4px;
          display: inline-block;
        }
        .ste-pipe-tag.blue { background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); }
        .ste-pipe-tag.green { background: rgba(34,197,94,0.08); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }

        .ste-flag-list { display: flex; flex-direction: column; gap: 0.3rem; }
        .ste-flag-tag {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.04em;
          padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-block;
        }
        .ste-flag-tag.gem { background: rgba(212,168,49,0.1); color: #d4a831; border: 1px solid rgba(212,168,49,0.25); }
        .ste-flag-tag.red { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

        .ste-summary-text {
          font-size: 0.78rem; line-height: 1.55; color: var(--text-secondary,#555);
          margin: 0; display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .ste-read-more {
          color: var(--accent-indigo); font-weight: 600; text-decoration: none;
          white-space: nowrap;
        }
        .ste-read-more:hover { text-decoration: underline; }

        .ste-deep-dive-btn {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.75rem;
          border-radius: 0.5rem; background: var(--bg-secondary);
          border: 1px solid var(--border-subtle); color: var(--text-primary);
          text-decoration: none; transition: all 0.15s; white-space: nowrap;
          opacity: 0; transform: translateX(4px);
        }
        .ste-deep-dive-btn:hover {
          background: var(--accent-indigo); color: white; border-color: var(--accent-indigo);
        }
      `}</style>
    </>
  );
}