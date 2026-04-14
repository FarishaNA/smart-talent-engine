import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getCandidate, getCandidateScore, deleteCandidate, getCandidateResumeUrl } from '../api';
import RadarChart from '../components/RadarChart';
import MatchMap from '../components/MatchMap';
import HiddenGemBadge from '../components/HiddenGemBadge';
import { CardSkeleton, DetailHeaderSkeleton } from '../components/LoadingSkeleton';

export default function CandidateDetail() {
  const { candidateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get('job');

  const [profile, setProfile] = useState(null);
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraceExpanded, setIsTraceExpanded] = useState(false);

  useEffect(() => {
    loadData();
  }, [candidateId, jobId]);

  const loadData = async () => {
    setIsLoading(true);
    console.log(`[Fetch] Loading candidate ${candidateId} (Job: ${jobId || 'None'})`);
    try {
      const pData = await getCandidate(candidateId);
      setProfile(pData);
      if (jobId) {
        console.log(`[Fetch] GET /api/candidates/${candidateId}/score/${jobId}`);
        const sData = await getCandidateScore(candidateId, jobId);
        console.log('[Fetch] Score response:', sData);
        setScore(sData);
      }
    } catch (e) {
      console.error('[Fetch] Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="page-enter pb-10">
        <div className="h-10 w-24 bg-[var(--bg-secondary)] animate-pulse rounded-lg mb-6"></div>
        <DetailHeaderSkeleton />
        <div className="three-col">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  // Build Radar Data (preserved exactly)
  let radarData = [];
  if (score && score.domain_coverage) {
    radarData = Object.entries(score.domain_coverage).map(([domain, value]) => ({
      domain, required: 100, candidate: value
    }));
  } else if (score && score.per_requirement) {
    const domainScores = {};
    score.per_requirement.forEach(req => {
      const matchedNode = profile.skill_nodes.find(sn =>
        sn.node_id === req.matched_via_node || sn.node_id === req.requirement_node_id
      );
      const domain = matchedNode?.domain || "General";
      if (!domainScores[domain]) domainScores[domain] = { reqs: 0, matches: 0 };
      domainScores[domain].reqs += req.base_weight;
      domainScores[domain].matches += req.weighted_score;
    });
    Object.entries(domainScores).forEach(([domain, stats]) => {
      radarData.push({
        domain, required: 100,
        candidate: Math.min(100, Math.round((stats.matches / stats.reqs) * 100))
      });
    });
  }

  const getScoreColor = (s) => {
    if (s >= 70) return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)' };
    if (s >= 45) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' };
    return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
  };

  const sc = score ? getScoreColor(score.compatibility_score) : null;

  return (
    <div className="ste-detail page-enter">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="ste-detail-topbar">
        <div className="ste-detail-topbar-left">
          <button onClick={() => navigate(-1)} className="ste-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>

          {score && (
            <div className="ste-match-chip" style={{
              color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`
            }}>
              <div className="ste-match-chip-dot" style={{ background: sc.color }} />
              {score.compatibility_score.toFixed(0)}% Match
            </div>
          )}
        </div>

        <div className="ste-detail-topbar-actions">
          <a
            href={getCandidateResumeUrl(candidateId)}
            target="_blank" rel="noopener noreferrer"
            className="ste-btn ste-btn-ghost"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Resume
          </a>
          <button
            onClick={async () => {
              if (window.confirm("Delete this candidate? This removes all scoring data and the resume file.")) {
                try {
                  await deleteCandidate(candidateId);
                  navigate(`/jobs/${jobId}/ranking`);
                } catch (e) { alert("Failed to delete: " + e.message); }
              }
            }}
            className="ste-btn ste-btn-danger"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* ── Three Column Grid ───────────────────────────────── */}
      <div className="ste-detail-grid">

        {/* ── LEFT: Profile Overview ──────────────────────── */}
        <div className="ste-col-left">

          {/* Identity Card */}
          <div className="ste-card">
            <div className="ste-identity">
              <div className="ste-avatar">
                {profile.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div>
                <h1 className="ste-candidate-heading">{profile.name}</h1>
                {profile.email && <p className="ste-candidate-email">{profile.email}</p>}
              </div>
            </div>

            <div className="ste-meta-grid">
              <div className="ste-meta-row">
                <span className="ste-meta-label">Experience</span>
                <span className="ste-meta-value">{profile.total_experience_years || '<1'} yrs</span>
              </div>
              <div className="ste-meta-row">
                <span className="ste-meta-label">Most Recent</span>
                <span className="ste-meta-value">{profile.most_recent_year || '—'}</span>
              </div>
              <div className="ste-meta-row">
                <span className="ste-meta-label">Skills Extracted</span>
                <span className="ste-meta-value">{profile.skill_nodes.length}</span>
              </div>
              <div className="ste-meta-row">
                <span className="ste-meta-label">Format</span>
                <span className="ste-meta-value" style={{ textTransform: 'uppercase' }}>{profile.resume_format}</span>
              </div>
            </div>

            {profile.candidate_type && (
              <div className={`ste-type-badge ${profile.candidate_type.badge_class || ''}`}>
                {profile.candidate_type.label}
              </div>
            )}

            <div className="ste-flags-block">
              <p className="ste-flags-title">Flags</p>
              <div className="ste-flags-list">
                {profile.keyword_stuffing_flag && (
                  <span className="ste-flag-chip red">⚠ Keyword Stuffing</span>
                )}
                {score?.hidden_gem_flag && (
                  <span className="ste-flag-chip gem">✦ {score.hidden_gem_type}</span>
                )}
                <span className={`ste-flag-chip ${profile.parse_confidence >= 0.8 ? 'green' : 'amber'}`}>
                  Parse {(profile.parse_confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Skill Verification */}
          {profile.skill_verification && (
            <div className="ste-card">
              <h3 className="ste-section-title">Skill Verification</h3>
              <div className="ste-verif-row">
                <span className="ste-verif-pct" style={{ color: 'var(--accent-indigo)' }}>
                  {(profile.skill_verification.verification_score * 100).toFixed(0)}%
                </span>
                <span className="ste-verif-label">Authenticity</span>
              </div>
              <div className="ste-progress-track">
                <div className="ste-progress-fill" style={{
                  width: `${profile.skill_verification.verification_score * 100}%`
                }} />
              </div>
              <p className="ste-verif-summary">{profile.skill_verification.summary}</p>
            </div>
          )}

          {/* Raw Extractions */}
          <div className="ste-card">
            <h3 className="ste-section-title">Graph Extractions</h3>
            <div className="ste-skill-cloud">
              {profile.skill_nodes.map((node, i) => (
                <span
                  key={i}
                  className="ste-skill-node"
                  title={`Found as: "${node.matched_via}" in ${node.section}`}
                >
                  {node.label}
                  <span className="ste-skill-domain">{node.domain}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: Match Breakdown ─────────────────────── */}
        <div className="ste-col-center">

          {score?.hidden_gem_flag && (
            <HiddenGemBadge type={score.hidden_gem_type} explanation={score.hidden_gem_explanation} />
          )}

          <div className="ste-card ste-match-card">
            <h2 className="ste-section-title">Requirement Coverage</h2>

            {score ? (
              <>
                <div className="ste-ai-summary-box">
                  <div className="ste-ai-summary-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    AI Recruiter Summary
                  </div>
                  <p className="ste-ai-summary-text">
                    {score.llm_reasoning || score.justification}
                  </p>
                </div>
                <MatchMap perRequirement={score.per_requirement} />
              </>
            ) : (
              <div className="ste-no-score">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
                <div className="ste-no-score-title">No scoring data</div>
                <p>Candidate hasn't been evaluated for a specific job yet.</p>
                <button onClick={() => navigate('/')} className="ste-btn ste-btn-primary" style={{ marginTop: '0.5rem' }}>
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Decision Trace */}
          {score?.decision_trace && (
            <div className="ste-card">
              <div className="ste-trace-header">
                <h2 className="ste-section-title" style={{ margin: 0 }}>AI Decision Trace</h2>
                <button
                  className="ste-trace-toggle"
                  onClick={() => setIsTraceExpanded(!isTraceExpanded)}
                >
                  {isTraceExpanded ? 'Hide ↑' : 'Show Full ↓'}
                </button>
              </div>
              {isTraceExpanded ? (
                <pre className="ste-trace-pre">{score.decision_trace}</pre>
              ) : (
                <div className="ste-trace-placeholder">
                  Full deterministic trace available for audit
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Gap & Radar ─────────────────────────── */}
        <div className="ste-col-right">

          {/* Hiring Profile */}
          {score?.hiring_profile && (
            <div className="ste-card">
              <h2 className="ste-section-title">Hiring Profile</h2>
              <div className={`ste-profile-card ${score.hiring_profile.badge_class || ''}`}>
                <div className="ste-profile-card-label">{score.hiring_profile.label}</div>
                <p className="ste-profile-card-rec">{score.hiring_profile.recommendation}</p>
              </div>
              {score.trajectory && (
                <div className="ste-trajectory">
                  <span className="ste-trajectory-label">Trajectory</span>
                  <span className="ste-trajectory-value">{score.trajectory.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Radar Chart */}
          <div className="ste-card">
            <h2 className="ste-section-title">Domain Coverage</h2>
            <RadarChart data={radarData} candidateName={profile.name.split(' ')[0]} />
          </div>

          {/* Gap Analysis */}
          {score?.gap_analysis && (
            <div className="ste-card">
              <h2 className="ste-section-title">Gap Analysis</h2>
              <div className="ste-gap-sections">

                <div className="ste-gap-group">
                  <div className="ste-gap-group-header green">
                    <span className="ste-gap-dot green" />
                    Strong Match
                  </div>
                  <div className="ste-gap-pills">
                    {score.gap_analysis.strong_match.map(s => (
                      <span key={s} className="ste-gap-pill green">{s}</span>
                    ))}
                    {score.gap_analysis.strong_match.length === 0 && (
                      <span className="ste-gap-empty">None found</span>
                    )}
                  </div>
                </div>

                <div className="ste-gap-group">
                  <div className="ste-gap-group-header amber">
                    <span className="ste-gap-dot amber" />
                    Partial / Transferable
                  </div>
                  <div className="ste-gap-pills">
                    {score.gap_analysis.partial_match.map(s => (
                      <span key={s} className="ste-gap-pill amber">{s}</span>
                    ))}
                    {score.gap_analysis.partial_match.length === 0 && (
                      <span className="ste-gap-empty">None found</span>
                    )}
                  </div>
                </div>

                <div className="ste-gap-group">
                  <div className="ste-gap-group-header red">
                    <span className="ste-gap-dot red" />
                    Missing Capabilities
                  </div>
                  <div className="ste-gap-pills">
                    {score.gap_analysis.missing.map(s => (
                      <span key={s} className="ste-gap-pill red">{s}</span>
                    ))}
                    {score.gap_analysis.missing.length === 0 && (
                      <span className="ste-gap-empty">None missing</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Behavioural Signals */}
          {score?.behavioural_signals?.length > 0 && (
            <div className="ste-card">
              <h2 className="ste-section-title">Behavioural Signals</h2>
              <div className="ste-behaviour-list">
                {score.behavioural_signals.map(s => (
                  <span key={s} className="ste-behaviour-chip">{s}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        .ste-detail {
          padding: 1.75rem 2.5rem 4rem;
          font-family: 'DM Sans', 'Inter', sans-serif;
        }

        /* Top Bar */
        .ste-detail-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.75rem; gap: 1rem;
        }
        .ste-detail-topbar-left { display: flex; align-items: center; gap: 0.875rem; }
        .ste-detail-topbar-actions { display: flex; align-items: center; gap: 0.5rem; }

        .ste-back-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em;
          color: var(--text-muted, #888); background: none; border: none;
          cursor: pointer; padding: 0; transition: color 0.15s;
        }
        .ste-back-btn:hover { color: var(--accent-indigo); }

        .ste-match-chip {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.3rem 0.75rem; border-radius: 99px;
          font-size: 0.8rem; font-weight: 800; letter-spacing: -0.01em;
        }
        .ste-match-chip-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }

        .ste-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.875rem; border-radius: 0.5rem; font-size: 0.8rem;
          font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
          letter-spacing: 0.01em; text-decoration: none;
        }
        .ste-btn-ghost {
          background: var(--bg-secondary); color: var(--text-primary);
          border: 1px solid var(--border-subtle);
        }
        .ste-btn-ghost:hover { background: var(--border-subtle); }
        .ste-btn-primary {
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          color: white; box-shadow: 0 2px 8px rgba(135,163,48,0.3);
        }
        .ste-btn-primary:hover { filter: brightness(1.07); }
        .ste-btn-danger {
          background: rgba(239,68,68,0.06); color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
        }
        .ste-btn-danger:hover { background: rgba(239,68,68,0.12); }

        /* Grid */
        .ste-detail-grid {
          display: grid;
          grid-template-columns: 260px 1fr 260px;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 1200px) {
          .ste-detail-grid { grid-template-columns: 240px 1fr 240px; }
        }
        @media (max-width: 960px) {
          .ste-detail-grid { grid-template-columns: 1fr 1fr; }
          .ste-col-center { grid-column: 1 / -1; order: -1; }
        }

        .ste-col-left, .ste-col-right, .ste-col-center {
          display: flex; flex-direction: column; gap: 1rem;
        }

        /* Cards */
        .ste-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 0.875rem; padding: 1.25rem; transition: box-shadow 0.15s;
        }
        .ste-section-title {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-muted, #999);
          margin: 0 0 1rem 0;
        }

        /* Identity */
        .ste-identity {
          display: flex; align-items: center; gap: 0.875rem; margin-bottom: 1.25rem;
        }
        .ste-avatar {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: rgba(135,163,48,0.12); color: var(--accent-indigo);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 800; letter-spacing: 0.01em;
          border: 1px solid rgba(135,163,48,0.2);
        }
        .ste-candidate-heading {
          font-size: 1.125rem; font-weight: 700; letter-spacing: -0.025em;
          color: var(--text-primary); margin: 0 0 0.15rem 0; line-height: 1.2;
        }
        .ste-candidate-email {
          font-size: 0.78rem; color: var(--text-muted, #999); margin: 0;
        }

        .ste-meta-grid { display: flex; flex-direction: column; gap: 0; }
        .ste-meta-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle);
        }
        .ste-meta-row:last-child { border-bottom: none; }
        .ste-meta-label { font-size: 0.75rem; color: var(--text-muted, #999); }
        .ste-meta-value { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }

        .ste-type-badge {
          margin-top: 0.875rem; padding: 0.35rem 0.75rem; border-radius: 6px;
          font-size: 0.72rem; font-weight: 700; text-align: center;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        .ste-flags-block { margin-top: 0.875rem; padding-top: 0.875rem; border-top: 1px solid var(--border-subtle); }
        .ste-flags-title {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-muted, #999); margin: 0 0 0.5rem 0;
        }
        .ste-flags-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .ste-flag-chip {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em;
          padding: 0.2rem 0.5rem; border-radius: 5px; display: inline-block;
        }
        .ste-flag-chip.red { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .ste-flag-chip.gem { background: rgba(212,168,49,0.1); color: #d4a831; border: 1px solid rgba(212,168,49,0.25); }
        .ste-flag-chip.green { background: rgba(34,197,94,0.08); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .ste-flag-chip.amber { background: rgba(245,158,11,0.08); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }

        /* Verification */
        .ste-verif-row { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.5rem; }
        .ste-verif-pct { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
        .ste-verif-label { font-size: 0.75rem; color: var(--text-muted, #999); font-weight: 500; }
        .ste-progress-track {
          height: 4px; background: var(--border-subtle); border-radius: 99px;
          overflow: hidden; margin-bottom: 0.625rem;
        }
        .ste-progress-fill {
          height: 100%; background: var(--accent-indigo); border-radius: 99px; transition: width 0.6s ease;
        }
        .ste-verif-summary { font-size: 0.73rem; color: var(--text-muted,#999); line-height: 1.55; margin: 0; }

        /* Skill Cloud */
        .ste-skill-cloud { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .ste-skill-node {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 5px;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          color: var(--text-secondary, #555);
        }
        .ste-skill-domain { font-size: 0.62rem; color: var(--text-muted,#999); opacity: 0.8; }

        /* Match Card */
        .ste-match-card { flex: 1; }
        .ste-ai-summary-box {
          background: rgba(135,163,48,0.04); border: 1px solid rgba(135,163,48,0.15);
          border-radius: 0.625rem; padding: 0.875rem 1rem; margin-bottom: 1.25rem;
        }
        .ste-ai-summary-label {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--accent-indigo); margin-bottom: 0.5rem;
        }
        .ste-ai-summary-text {
          font-size: 0.82rem; line-height: 1.65; color: var(--text-secondary, #555);
          margin: 0; font-style: italic;
        }

        .ste-no-score {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.5rem; padding: 3rem 1rem; text-align: center;
        }
        .ste-no-score-title { font-weight: 700; font-size: 1rem; }
        .ste-no-score p { font-size: 0.82rem; color: var(--text-muted,#999); margin: 0; }

        /* Trace */
        .ste-trace-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.875rem;
        }
        .ste-trace-toggle {
          font-size: 0.75rem; font-weight: 700; color: var(--accent-indigo);
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .ste-trace-toggle:hover { text-decoration: underline; }
        .ste-trace-pre {
          font-size: 0.72rem; padding: 1rem; background: #0f0f0f;
          color: #a3e635; border-radius: 0.5rem; overflow-x: auto;
          white-space: pre-wrap; border: 1px solid #1a1a1a; line-height: 1.6;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .ste-trace-placeholder {
          font-size: 0.75rem; color: var(--text-muted,#999); font-style: italic;
          text-align: center; padding: 0.875rem;
          border: 1px dashed var(--border-subtle); border-radius: 0.5rem;
        }

        /* Hiring Profile */
        .ste-profile-card {
          padding: 0.875rem; border-radius: 0.625rem; margin-bottom: 0.75rem;
          border: 1px solid var(--border-subtle); background: var(--bg-secondary);
        }
        .ste-profile-card-label { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.375rem; }
        .ste-profile-card-rec { font-size: 0.78rem; color: var(--text-secondary,#555); margin: 0; line-height: 1.55; }
        .ste-trajectory {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.5rem 0.75rem; background: var(--bg-secondary);
          border-radius: 0.5rem; border: 1px solid var(--border-subtle);
        }
        .ste-trajectory-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-muted,#999); }
        .ste-trajectory-value { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }

        /* Gap Analysis */
        .ste-gap-sections { display: flex; flex-direction: column; gap: 1rem; }
        .ste-gap-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .ste-gap-group-header {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        }
        .ste-gap-group-header.green { color: #22c55e; }
        .ste-gap-group-header.amber { color: #f59e0b; }
        .ste-gap-group-header.red { color: #ef4444; }
        .ste-gap-dot { width: 6px; height: 6px; border-radius: 50%; }
        .ste-gap-dot.green { background: #22c55e; }
        .ste-gap-dot.amber { background: #f59e0b; }
        .ste-gap-dot.red { background: #ef4444; }
        .ste-gap-pills { display: flex; flex-wrap: wrap; gap: 0.3rem; }
        .ste-gap-pill {
          font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 5px; font-weight: 600;
        }
        .ste-gap-pill.green { background: rgba(34,197,94,0.08); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .ste-gap-pill.amber { background: rgba(245,158,11,0.08); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .ste-gap-pill.red { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .ste-gap-empty { font-size: 0.72rem; color: var(--text-muted,#999); font-style: italic; }

        /* Behavioural */
        .ste-behaviour-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .ste-behaviour-chip {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 0.25rem 0.6rem; border-radius: 5px;
          background: rgba(99,102,241,0.08); color: #818cf8;
          border: 1px solid rgba(99,102,241,0.2);
        }
      `}</style>
    </div>
  );
}