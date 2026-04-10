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
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Build Radar Data
  let radarData = [];
  if (score && score.domain_coverage) {
    // Prefer backend pre-calculated coverage
    radarData = Object.entries(score.domain_coverage).map(([domain, value]) => ({
      domain,
      required: 100,
      candidate: value
    }));
  } else if (score && score.per_requirement) {
    // Fallback logic
    const domainScores = {};
    score.per_requirement.forEach(req => {
      const matchedNode = profile.skill_nodes.find(sn =>
        sn.node_id === req.matched_via_node || sn.node_id === req.requirement_node_id
      );
      const domain = matchedNode?.domain || "General";

      if (!domainScores[domain]) {
        domainScores[domain] = { reqs: 0, matches: 0 };
      }
      domainScores[domain].reqs += req.base_weight;
      domainScores[domain].matches += req.weighted_score;
    });

    Object.entries(domainScores).forEach(([domain, stats]) => {
      radarData.push({
        domain,
        required: 100,
        candidate: Math.min(100, Math.round((stats.matches / stats.reqs) * 100))
      });
    });
  }

  const getScorePillClass = (s) => {
    if (s >= 70) return 'score-pill-high';
    if (s >= 45) return 'score-pill-mid';
    return 'score-pill-low';
  };

  return (
    <div className="page-enter pb-10">
      <div className="mb-6 flex gap-4 items-center">
        <button onClick={() => navigate(-1)} className="btn btn-ghost !px-0 opacity-70 hover:opacity-100">
          ← Back
        </button>
        {score && (
          <span className={`score-pill ${getScorePillClass(score.compatibility_score)}`}>
            {score.compatibility_score.toFixed(0)}% Match
          </span>
        )}
        <div className="ml-auto flex gap-3">
          <a
            href={getCandidateResumeUrl(candidateId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary flex items-center gap-2"
          >
            <span>📥</span> Download Resume
          </a>
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete this candidate? This will remove all scoring data and the resume file.")) {
                try {
                  await deleteCandidate(candidateId);
                  navigate(`/jobs/${jobId}/ranking`);
                } catch (e) {
                  alert("Failed to delete candidate: " + e.message);
                }
              }
            }}
            className="btn border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center gap-2"
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      <div className="three-col">

        {/* Left Column: Candidate Overview */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
            {profile.email && <p className="text-[var(--text-secondary)] mb-4">{profile.email}</p>}

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)]">Experience</span>
                <span className="font-semibold">{profile.total_experience_years || '<1'} years</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)]">Most Recent</span>
                <span className="font-semibold">{profile.most_recent_year || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)]">Extracted Skills</span>
                <span className="font-semibold">{profile.skill_nodes.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)]">Format</span>
                <span className="font-semibold uppercase">{profile.resume_format}</span>
              </div>
              {profile.candidate_type && (
                <div className={`mt-2 p-2 rounded text-center text-xs font-bold ${profile.candidate_type.badge_class}`}>
                  {profile.candidate_type.label}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex flex-col gap-2">
              <div className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">Flags</div>
              {profile.keyword_stuffing_flag && (
                <div className="badge badge-red w-fit">⚠️ Keyword Stuffing Detected</div>
              )}
              {score && score.hidden_gem_flag && (
                <div className="badge badge-amber w-fit">🔮 {score.hidden_gem_type}</div>
              )}
              <div className={`badge w-fit ${profile.parse_confidence >= 0.8 ? 'badge-green' : 'badge-amber'
                }`}>
                Parse Conf: {(profile.parse_confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Skill Verification */}
          {profile.skill_verification && (
            <div className="card">
              <h3 className="section-title text-base mb-2">Skill Verification</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Authenticity Score</span>
                  <span className="font-bold text-[var(--accent-indigo)]">{(profile.skill_verification.verification_score * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--accent-indigo)] h-full" style={{ width: `${profile.skill_verification.verification_score * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  {profile.skill_verification.summary}
                </p>
              </div>
            </div>
          )}

          {/* Raw Skill Extractions */}
          <div className="card">
            <h3 className="section-title text-base mb-4">Raw Graph Extractions</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skill_nodes.map((node, i) => (
                <span key={i} className="text-[11px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-2 py-1 rounded-md text-[var(--text-secondary)]" title={`Found as: "${node.matched_via}" in ${node.section}`}>
                  {node.label} <span className="opacity-40">({node.domain})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Match Breakdown */}
        <div className="flex flex-col gap-6 w-full">
          {score && score.hidden_gem_flag && (
            <HiddenGemBadge
              type={score.hidden_gem_type}
              explanation={score.hidden_gem_explanation}
            />
          )}

          <div className="card flex-1">
            <h2 className="section-title">Requirement Coverage</h2>
            {score ? (
              <>
                <div className="bg-[rgba(135,163,48,0.05)] p-4 rounded-lg border border-[rgba(135,163,48,0.1)] mb-6">
                  <div className="text-xs font-bold text-[var(--accent-indigo)] uppercase mb-2">AI Recruiter Summary</div>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic">
                    "{score.llm_reasoning || score.justification}"
                  </p>
                </div>
                <MatchMap perRequirement={score.per_requirement} />
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon text-4xl mb-4">📊</div>
                <div className="empty-state-title">No scoring data available</div>
                <p className="text-sm text-[var(--text-muted)] mb-6">This candidate has not been evaluated for a specific job yet.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">Return to Dashboard</button>
              </div>
            )}
          </div>
          {score && score.decision_trace && (
            <div className="card mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="section-title m-0">AI Decision Trace</h2>
                <button
                  className="text-xs font-bold text-[var(--accent-indigo)] hover:underline"
                  onClick={() => setIsTraceExpanded(!isTraceExpanded)}
                >
                  {isTraceExpanded ? "Hide Trace ↑" : "Show Full Trace ↓"}
                </button>
              </div>

              {isTraceExpanded ? (
                <pre className="text-xs p-4 bg-gray-900 text-gray-300 rounded overflow-x-auto whitespace-pre-wrap border border-gray-800">
                  {score.decision_trace}
                </pre>
              ) : (
                <div className="text-xs text-[var(--text-muted)] italic p-2 border border-dashed border-gray-800 rounded text-center">
                  Full deterministic trace available for audit.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Gap Analysis */}
        <div className="flex flex-col gap-6">
          {score && score.hiring_profile && (
            <div className="card">
              <h2 className="section-title">Hiring Profile Classification</h2>
              <div className={`p-4 rounded border ${score.hiring_profile.badge_class ? score.hiring_profile.badge_class.replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'border-') : ''}`}>
                <div className={`text-lg font-bold ${score.hiring_profile.badge_class ? score.hiring_profile.badge_class.split(' ')[1] : ''}`}>
                  {score.hiring_profile.label}
                </div>
                <div className="text-sm mt-2">{score.hiring_profile.recommendation}</div>
              </div>
              <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Skill Trajectory</div>
                <div className="text-sm">{score.trajectory?.label || 'Unknown'}</div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="section-title">Domain Coverage</h2>
            <RadarChart data={radarData} candidateName={profile.name.split(' ')[0]} />
          </div>

          {score && score.gap_analysis && (
            <div className="card">
              <h2 className="section-title">Gap Analysis</h2>
              <div className="flex flex-col gap-4">

                {/* ... gap analysis segments ... */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">Strong Match</div>
                  <div className="flex flex-wrap gap-1.5">
                    {score.gap_analysis.strong_match.map(s => (
                      <span key={s} className="pill bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{s}</span>
                    ))}
                    {score.gap_analysis.strong_match.length === 0 && <span className="text-xs text-[var(--text-muted)] italic">None found</span>}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">Partial Transferable</div>
                  <div className="flex flex-wrap gap-1.5">
                    {score.gap_analysis.partial_match.map(s => (
                      <span key={s} className="pill bg-amber-500/10 text-amber-500 border-amber-500/30">{s}</span>
                    ))}
                    {score.gap_analysis.partial_match.length === 0 && <span className="text-xs text-[var(--text-muted)] italic">None found</span>}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">Missing Capabilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {score.gap_analysis.missing.map(s => (
                      <span key={s} className="pill bg-red-500/10 text-red-400 border-red-500/20">{s}</span>
                    ))}
                    {score.gap_analysis.missing.length === 0 && <span className="text-xs text-[var(--text-muted)] italic">None missing</span>}
                  </div>
                </div>

              </div>
            </div>
          )}

          {score && score.behavioural_signals && score.behavioural_signals.length > 0 && (
            <div className="card">
              <h2 className="section-title text-base">Behavioural Signals</h2>
              <div className="flex flex-wrap gap-2">
                {score.behavioural_signals.map(s => (
                  <span key={s} className="badge badge-indigo text-[11px] uppercase tracking-wider px-2 py-1">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
