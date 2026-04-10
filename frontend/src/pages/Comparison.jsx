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
    return <div className="p-10 text-center animate-pulse">Running Comparative Analysis...</div>;
  }

  // Build combined Radar Data
  const radarData = [];
  const domains = new Set();

  // Collect all domains across all candidates for this job
  comparison.candidates.forEach(cand => {
    cand.per_requirement.forEach(req => {
      // Find the matched domain (simplification: assume per_requirement comes with domain if possible,
      // or we extract it. since it's not directly in per_req, we map via matched_via_node conceptually.
      // But standard way: just map from perRequirement labels directly for comparison.
      domains.add(req.requirement_label);
    });
  });

  const domainArray = Array.from(domains).slice(0, 8); // at most 8 axes for readability

  domainArray.forEach(domain => {
    const dataPoint = { domain };
    comparison.candidates.forEach((cand, idx) => {
      const match = cand.per_requirement.find(r => r.requirement_label === domain);
      dataPoint[`cand_${idx}`] = match ? match.weighted_score * 100 : 0; // Simplified scale
    });
    radarData.push(dataPoint);
  });

  return (
    <div className="animate-in pb-10">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost !px-0 mb-3 opacity-70 hover:opacity-100">
            ← Back to Ranking
          </button>
          <h1 className="text-3xl font-bold mb-1">Comparative Analysis</h1>
          <p className="text-[var(--text-secondary)]">{job?.title}</p>
        </div>
      </div>

      {/* AI Summary Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-xl p-5 mb-8 shadow-[var(--shadow-glow)]">
        <div className="flex gap-4 items-start">
          <div className="text-2xl mt-1">🤖</div>
          <div>
            <h3 className="font-bold text-[var(--accent-indigo)] mb-1">Automated Recommendation</h3>
            <p className="text-[var(--text-primary)] leading-relaxed">{comparison.summary}</p>
            {comparison.differentiator && (
              <p className="text-sm mt-3 pt-3 border-t border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <span className="font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] mr-2">Key Differentiator</span>
                {comparison.differentiator.requirement}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="data-table !border-0 w-full">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="w-1/4 border-r border-[var(--border-subtle)]">Requirement (from JD)</th>
                {comparison.candidates.map((c, i) => (
                  <th key={c.candidate_id} className={`w-[${75 / comparison.candidates.length}%] text-center`}>
                    <div className="font-bold text-[var(--text-primary)] text-sm mb-1">{c.name}</div>
                    <div className={`score-pill text-xs px-2 py-0.5 ${c.compatibility_score >= 70 ? 'score-pill-high' : c.compatibility_score >= 45 ? 'score-pill-mid' : 'score-pill-low'}`}>
                      {c.compatibility_score.toFixed(0)}% Overall
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.candidates[0]?.per_requirement.map((req, r_idx) => {
                const label = req.requirement_label;
                const scores = comparison.candidates.map(c => {
                  const r = c.per_requirement.find(x => x.requirement_label === label);
                  return r ? r.weighted_score : 0;
                });

                const isDifferentiator = comparison.differentiator?.requirement === label;

                return (
                  <tr key={r_idx} className={isDifferentiator ? 'bg-[rgba(99,102,241,0.08)]' : ''}>
                    <td className="font-medium text-[var(--text-primary)] border-r border-[var(--border-subtle)]">
                      {label}
                      {isDifferentiator && <span className="ml-2 text-xs badge badge-indigo !px-1.5 py-0">Key Diff</span>}
                    </td>
                    {comparison.candidates.map((c, c_idx) => {
                      const matchResult = c.per_requirement.find(x => x.requirement_label === label);

                      if (!matchResult || matchResult.match_type === 'missing') {
                        return <td key={c_idx} className="text-center text-[var(--text-muted)] text-sm">❌ Missing</td>;
                      }

                      return (
                        <td key={c_idx} className="text-center">
                          <div className={`text-sm mb-1 font-semibold ${matchResult.match_type === 'direct' ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-amber)]'}`}>
                            {(matchResult.weighted_score * 100).toFixed(0)} <span className="text-xs opacity-50 font-normal">pts</span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {matchResult.match_type === 'direct' ? 'Direct Match' : `Inferred via ${matchResult.matched_via_node}`}
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
    </div>
  );
}
