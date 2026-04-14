import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { compareCandidates, getJob } from '../api';
import RadarChart from '../components/RadarChart';

export default function Comparison() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'radar'

  useEffect(() => {
    const candidateIds = location.state?.candidateIds || [];
    if (candidateIds.length < 2) {
      alert("Need at least 2 candidates to compare.");
      navigate(`/jobs/${jobId}/ranking`);
      return;
    }
    loadData(candidateIds);
  }, [jobId, location]);

  const loadData = async (candidateIds) => {
    try {
      setLoading(true);
      const [jobData, compareData] = await Promise.all([
        getJob(jobId),
        compareCandidates(candidateIds, jobId)
      ]);
      setJob(jobData);
      setComparison(compareData);
    } catch (e) {
      console.error(e);
      alert("Failed to load comparison data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !comparison) {
    return (
      <div className="ste-compare-loading">
        <div className="ste-compare-loading-spinner" />
        <p>Running Comparative Analysis…</p>
      </div>
    );
  }

  // Build Radar Data (exact logic preserved)
  const radarData = [];
  const domains = new Set();
  comparison.candidates.forEach(cand => {
    cand.per_requirement.forEach(req => { domains.add(req.requirement_label); });
  });
  const domainArray = Array.from(domains).slice(0, 8);
  domainArray.forEach(domain => {
    const dataPoint = { domain };
    comparison.candidates.forEach((cand, idx) => {
      const match = cand.per_requirement.find(r => r.requirement_label === domain);
      dataPoint[`cand_${idx}`] = match ? match.weighted_score * 100 : 0;
    });
    radarData.push(dataPoint);
  });

  const getRankConfig = (i) => {
    const configs = [
      { label: '#1 Best Match', color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', ring: 'rgba(217,119,6,0.15)' },
      { label: '#2 Strong Match', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', ring: 'rgba(107,114,128,0.1)' },
      { label: '#3 Good Match', color: '#92400e', bg: 'rgba(146,64,14,0.08)', border: 'rgba(146,64,14,0.2)', ring: 'rgba(146,64,14,0.08)' },
    ];
    return configs[i] || { label: `#${i + 1}`, color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)', ring: 'transparent' };
  };

  const getScoreColor = (s) => {
    if (s >= 70) return '#16a34a';
    if (s >= 45) return '#d97706';
    return '#ef4444';
  };

  const sortedCandidates = [...comparison.candidates].sort((a, b) => b.compatibility_score - a.compatibility_score);

  return (
    <div className="ste-compare">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="ste-compare-header">
        <div>
          <button onClick={() => navigate(-1)} className="ste-compare-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Ranking
          </button>
          <h1 className="ste-compare-title">Comparative Analysis</h1>
          {job && <p className="ste-compare-sub">{job.title}</p>}
        </div>

        <div className="ste-compare-tabs">
          <button className={`ste-tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            Breakdown Table
          </button>
          <button className={`ste-tab ${activeTab === 'radar' ? 'active' : ''}`} onClick={() => setActiveTab('radar')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Radar View
          </button>
        </div>
      </header>

      {/* ── Candidate Cards ──────────────────────────────── */}
      <div className="ste-candidate-cards" style={{
        gridTemplateColumns: `repeat(${sortedCandidates.length}, 1fr)`
      }}>
        {sortedCandidates.map((c, i) => {
          const rank = getRankConfig(i);
          const sc = getScoreColor(c.compatibility_score);
          return (
            <div
              key={c.candidate_id}
              className={`ste-cand-card ${i === 0 ? 'winner' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {i === 0 && <div className="ste-winner-glow" />}
              <div className="ste-cand-rank" style={{ color: rank.color, background: rank.bg, border: `1px solid ${rank.border}` }}>
                {rank.label}
              </div>
              <div className="ste-cand-name">{c.name}</div>

              {/* Score Ring */}
              <div className="ste-score-ring-wrap">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="38" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
                  <circle
                    cx="44" cy="44" r="38" fill="none"
                    stroke={sc} strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - c.compatibility_score / 100)}`}
                    transform="rotate(-90 44 44)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                  <text x="44" y="44" dominantBaseline="middle" textAnchor="middle"
                    fill={sc} fontSize="16" fontWeight="800" fontFamily="'DM Sans', sans-serif"
                  >
                    {c.compatibility_score.toFixed(0)}%
                  </text>
                </svg>
              </div>

              <div className="ste-cand-meta">
                <div className="ste-cand-conf" style={{
                  color: c.confidence_level === 'high' ? '#16a34a' : c.confidence_level === 'medium' ? '#d97706' : '#ef4444',
                }}>
                  {c.confidence_level} confidence
                </div>
              </div>

              {/* Top skills */}
              {c.direct_matches?.length > 0 && (
                <div className="ste-cand-skills">
                  {c.direct_matches.slice(0, 4).map((m, si) => (
                    <span key={si} className="ste-cand-skill">{m.label}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── AI Summary ──────────────────────────────────── */}
      <div className="ste-ai-box">
        <div className="ste-ai-box-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div className="ste-ai-box-content">
          <div className="ste-ai-box-label">Automated Recommendation</div>
          <p className="ste-ai-box-text">{comparison.summary}</p>
          {comparison.differentiator && (
            <div className="ste-ai-differentiator">
              <span className="ste-ai-diff-label">Key Differentiator</span>
              <span className="ste-ai-diff-val">{comparison.differentiator.requirement}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────── */}
      {activeTab === 'table' && (
        <div className="ste-compare-table-wrap">
          <div className="ste-compare-scroll">
            <table className="ste-compare-table">
              <thead>
                <tr>
                  <th className="ste-compare-th-req">Requirement</th>
                  {sortedCandidates.map((c, i) => (
                    <th key={c.candidate_id} className="ste-compare-th-cand">
                      <div className="ste-compare-th-name">{c.name.split(' ')[0]}</div>
                      <div className="ste-compare-th-score" style={{ color: getScoreColor(c.compatibility_score) }}>
                        {c.compatibility_score.toFixed(0)}%
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCandidates[0]?.per_requirement.map((req, r_idx) => {
                  const label = req.requirement_label;
                  const isDiff = comparison.differentiator?.requirement === label;

                  return (
                    <tr key={r_idx} className={`ste-compare-row ${isDiff ? 'diff' : ''}`}>
                      <td className="ste-compare-td-req">
                        {label}
                        {isDiff && <span className="ste-diff-badge">Key</span>}
                      </td>
                      {sortedCandidates.map((c, c_idx) => {
                        const mr = c.per_requirement.find(x => x.requirement_label === label);
                        if (!mr || mr.match_type === 'missing') {
                          return (
                            <td key={c_idx} className="ste-compare-td-cell missing">
                              <span className="ste-match-missing">✗ Missing</span>
                            </td>
                          );
                        }
                        const pts = (mr.weighted_score * 100).toFixed(0);
                        return (
                          <td key={c_idx} className="ste-compare-td-cell">
                            <div className="ste-match-pts" style={{
                              color: mr.match_type === 'direct' ? '#16a34a' : '#d97706'
                            }}>
                              {pts}
                              <span className="ste-match-unit">pts</span>
                            </div>
                            <div className="ste-match-bar-track">
                              <div className="ste-match-bar-fill" style={{
                                width: `${Math.min(100, pts)}%`,
                                background: mr.match_type === 'direct' ? '#16a34a' : '#d97706'
                              }} />
                            </div>
                            <div className="ste-match-type">
                              {mr.match_type === 'direct' ? 'Direct' : `via ${mr.matched_via_node}`}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'radar' && (
        <div className="ste-compare-radar-wrap">
          <div className="ste-card">
            <RadarChart data={radarData} candidateName={sortedCandidates[0]?.name} />
          </div>
        </div>
      )}

      {/* ── Styles ─────────────────────────────────────── */}
      <style>{`
        .ste-compare {
          font-family: 'DM Sans', -apple-system, sans-serif;
          padding: 2rem 0 5rem; display: flex; flex-direction: column; gap: 1.75rem;
        }

        .ste-compare-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1rem; min-height: 300px; color: var(--text-muted); font-size: 0.9rem;
        }
        .ste-compare-loading-spinner {
          width: 32px; height: 32px; border-radius: 50%;
          border: 3px solid var(--border-subtle);
          border-top-color: var(--accent-indigo);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Header */
        .ste-compare-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }
        .ste-compare-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: none; border: none; cursor: pointer;
          font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
          padding: 0; margin-bottom: 0.75rem; transition: color 0.15s;
        }
        .ste-compare-back:hover { color: var(--accent-indigo); }
        .ste-compare-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 2rem; font-weight: 400; letter-spacing: -0.03em;
          color: var(--text-primary);
        }
        .ste-compare-sub { font-size: 0.83rem; color: var(--text-muted); margin-top: 0.2rem; }

        .ste-compare-tabs {
          display: flex; background: var(--bg-secondary);
          border: 1px solid var(--border-subtle); border-radius: 0.625rem;
          padding: 3px; gap: 2px;
        }
        .ste-tab {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.425rem 0.875rem; border-radius: 0.45rem;
          font-size: 0.78rem; font-weight: 600; border: none; cursor: pointer;
          background: none; color: var(--text-muted); transition: all 0.15s;
        }
        .ste-tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .ste-tab:hover:not(.active) { color: var(--text-primary); }

        /* Candidate Cards */
        .ste-candidate-cards {
          display: grid; gap: 1rem;
        }
        .ste-cand-card {
          position: relative; overflow: hidden;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 1rem; padding: 1.5rem;
          display: flex; flex-direction: column; align-items: center;
          gap: 0.875rem; text-align: center;
          transition: all 0.2s ease;
          animation: cardIn 0.45s ease both;
        }
        @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .ste-cand-card.winner {
          border-color: rgba(217,119,6,0.25);
          box-shadow: 0 8px 28px rgba(217,119,6,0.08);
        }
        .ste-winner-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(217,119,6,0.06), transparent 70%);
        }

        .ste-cand-rank {
          font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 0.25rem 0.75rem;
          border-radius: 99px; z-index: 1;
        }
        .ste-cand-name {
          font-size: 1.0625rem; font-weight: 700; letter-spacing: -0.025em;
          color: var(--text-primary); z-index: 1;
        }
        .ste-score-ring-wrap { z-index: 1; }
        .ste-cand-meta { z-index: 1; }
        .ste-cand-conf {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .ste-cand-skills {
          display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center; z-index: 1;
        }
        .ste-cand-skill {
          font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 5px;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        /* AI Box */
        .ste-ai-box {
          display: flex; gap: 1rem; align-items: flex-start;
          background: var(--bg-card); border: 1px solid rgba(135,163,48,0.2);
          border-radius: 1rem; padding: 1.25rem;
          box-shadow: 0 4px 16px rgba(135,163,48,0.06);
        }
        .ste-ai-box-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: rgba(135,163,48,0.1); border: 1px solid rgba(135,163,48,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-indigo);
        }
        .ste-ai-box-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--accent-indigo); margin-bottom: 0.5rem;
        }
        .ste-ai-box-text {
          font-size: 0.875rem; line-height: 1.65; color: var(--text-primary); margin: 0;
        }
        .ste-ai-differentiator {
          display: flex; align-items: center; gap: 0.625rem;
          margin-top: 0.875rem; padding-top: 0.875rem;
          border-top: 1px solid var(--border-subtle);
        }
        .ste-ai-diff-label {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted);
          background: var(--bg-secondary); padding: 0.2rem 0.5rem; border-radius: 4px;
          white-space: nowrap;
        }
        .ste-ai-diff-val { font-size: 0.83rem; color: var(--text-secondary); }

        /* Table */
        .ste-compare-table-wrap {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 1rem; overflow: hidden;
        }
        .ste-compare-scroll { overflow-x: auto; }
        .ste-compare-table {
          width: 100%; border-collapse: collapse; font-size: 0.82rem;
        }
        .ste-compare-table thead tr {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
        }
        .ste-compare-th-req {
          padding: 0.875rem 1.25rem; text-align: left;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-muted);
          min-width: 200px; border-right: 1px solid var(--border-subtle);
        }
        .ste-compare-th-cand {
          padding: 0.875rem 1rem; text-align: center;
          min-width: 150px; border-right: 1px solid var(--border-subtle);
        }
        .ste-compare-th-cand:last-child { border-right: none; }
        .ste-compare-th-name { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem; }
        .ste-compare-th-score { font-size: 0.9rem; font-weight: 800; letter-spacing: -0.02em; }

        .ste-compare-row { border-bottom: 1px solid var(--border-subtle); transition: background 0.12s; }
        .ste-compare-row:last-child { border-bottom: none; }
        .ste-compare-row:hover { background: rgba(135,163,48,0.02); }
        .ste-compare-row.diff { background: rgba(135,163,48,0.03); }

        .ste-compare-td-req {
          padding: 0.875rem 1.25rem; font-weight: 600;
          color: var(--text-primary); border-right: 1px solid var(--border-subtle);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .ste-diff-badge {
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 4px;
          background: rgba(135,163,48,0.1); color: var(--accent-indigo);
        }
        .ste-compare-td-cell {
          padding: 0.75rem 1rem; text-align: center;
          border-right: 1px solid var(--border-subtle);
          vertical-align: middle;
        }
        .ste-compare-td-cell:last-child { border-right: none; }
        .ste-compare-td-cell.missing { color: var(--text-muted); }
        .ste-match-missing {
          font-size: 0.72rem; font-weight: 600; color: #ef4444; opacity: 0.7;
        }
        .ste-match-pts {
          font-size: 0.875rem; font-weight: 800; letter-spacing: -0.02em;
          line-height: 1; margin-bottom: 0.3rem;
        }
        .ste-match-unit { font-size: 0.65rem; font-weight: 500; opacity: 0.6; margin-left: 1px; }
        .ste-match-bar-track {
          height: 3px; background: var(--border-subtle); border-radius: 99px;
          overflow: hidden; margin: 0.25rem auto; max-width: 80px;
        }
        .ste-match-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        .ste-match-type { font-size: 0.65rem; color: var(--text-muted); }

        /* Radar wrap */
        .ste-compare-radar-wrap { }
        .ste-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 1rem; padding: 1.5rem;
        }
      `}</style>
    </div>
  );
}