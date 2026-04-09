import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getRanking } from '../api';
import CandidateRow from '../components/CandidateRow';
import HiddenGemBadge from '../components/HiddenGemBadge';

export default function Ranking() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [minScore, setMinScore] = useState(0);
  const [showGemsOnly, setShowGemsOnly] = useState(false);
  const [hideStuffing, setHideStuffing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showJD, setShowJD] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const [jobData, rankingData] = await Promise.all([
        getJob(jobId),
        getRanking(jobId)
      ]);
      setJob(jobData);
      setCandidates(rankingData.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2 && selectedIds.length <= 3) {
      // Pass ids as query param or state? Or just post.
      navigate(`/jobs/${jobId}/compare`, { state: { candidateIds: selectedIds } });
    } else {
      alert("Please select exactly 2 or 3 candidates to compare.");
    }
  };

  const handleExport = () => {
    // Generate simple CSV
    const headers = ['Rank', 'Name', 'Score', 'Confidence', 'Hidden Gem', 'Top Skills'];
    const rows = filteredCandidates.map((c, i) => [
      i + 1,
      `"${c.name}"`,
      c.compatibility_score.toFixed(1),
      c.confidence_level,
      c.hidden_gem_flag ? 'Yes' : 'No',
      `"${c.direct_matches.map(m=>m.label).join(', ')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ranking_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (c.compatibility_score < minScore) return false;
      if (showGemsOnly && !c.hidden_gem_flag) return false;
      if (hideStuffing && c.keyword_stuffing_flag) return false;
      if (typeFilter !== 'all' && c.hiring_profile?.type !== typeFilter) return false;
      return true;
    });
  }, [candidates, minScore, showGemsOnly, hideStuffing]);

  const hiddenGems = candidates.filter(c => c.hidden_gem_flag);

  return (
    <div className="animate-in flex flex-col h-full min-h-[calc(100vh-100px)]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={() => navigate('/')} className="btn btn-ghost !px-0 mb-3 opacity-70 hover:opacity-100">
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-1">{job?.title || 'Job Ranking'}</h1>
          <p className="text-[var(--text-secondary)]">Sorted by deterministic compatibility score.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            className={`btn ${showJD ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setShowJD(!showJD)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {showJD ? 'Hide JD' : 'Review JD'}
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
          {selectedIds.length >= 2 && (
            <button className="btn btn-primary animate-in" onClick={handleCompare}>
              Compare {selectedIds.length} Candidates
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6 flex-1 items-start">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <h3 className="sidebar-title">Filters</h3>
          
          <div className="filter-group">
            <div className="flex justify-between items-center mb-2">
              <label className="filter-label !mb-0">Min Score</label>
              <span className="text-xs font-bold text-[var(--accent-indigo)]">{minScore}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={minScore} 
              onChange={e => setMinScore(Number(e.target.value))} 
            />
          </div>

          <div className="filter-group border-t border-[var(--border-subtle)] pt-4 mt-4">
            <label className="filter-label">Experience Type</label>
            <select 
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm mt-2"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Candidates</option>
              <option value="fresher">Freshers / Students</option>
              <option value="junior">Junior Professionals</option>
              <option value="senior">Senior Professionals</option>
            </select>
          </div>

          <div className="filter-group border-t border-[var(--border-subtle)] pt-4 mt-4">
            <label className="filter-label">Flags</label>
            <div className="flex flex-col gap-3 mt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="toggle">
                  <input type="checkbox" checked={showGemsOnly} onChange={e => setShowGemsOnly(e.target.checked)} />
                  <div className="toggle-slider"></div>
                </div>
                <span className="text-sm">Hidden Gems Only</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="toggle">
                  <input type="checkbox" checked={hideStuffing} onChange={e => setHideStuffing(e.target.checked)} />
                  <div className="toggle-slider"></div>
                </div>
                <span className="text-sm">Hide Keyword Stuffers</span>
              </label>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.15)]">
            <div className="font-semibold text-sm mb-1 text-[var(--accent-indigo)]">✨ Hybrid AI Pipeline</div>
            <p className="text-xs text-[var(--text-secondary)]">
              Stage 1: Semantic Retrieval (Top 30)<br/>
              Stage 2: LLM Skill Extraction<br/>
              Stage 3: Graph Scoring & Validation<br/>
              Stage 4: LLM Reasoning Re-rank (Top 10)
            </p>
          </div>
        </aside>

        {/* Main Table Area */}
        <div className="flex-1 flex flex-col gap-6 w-full overflow-hidden">
          
          {/* Job Description Card */}
          {showJD && job && (
            <div className="card animate-in mb-2 bg-[rgba(99,102,241,0.03)] border-[rgba(99,102,241,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <button 
                  onClick={() => setShowJD(false)}
                  className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded-full text-[var(--text-muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <h3 className="text-sm font-bold text-[var(--accent-indigo)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Job Description
              </h3>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                {job.description}
              </div>
            </div>
          )}
          
          {/* Hidden Gems Highlight Section (if not filtering only gems && gems exist) */}
          {!showGemsOnly && hiddenGems.length > 0 && (
            <div className="w-full">
              {hiddenGems.slice(0, 2).map((gem, i) => (
                <div key={i} className="mb-2">
                  <HiddenGemBadge 
                    type={gem.hidden_gem_type} 
                    explanation={`${gem.name}: ${gem.hidden_gem_explanation}`} 
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto w-full custom-scrollbar pb-2">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">Compare</th>
                    <th className="w-16">Rank</th>
                    <th>Candidate</th>
                    <th>Score</th>
                    <th className="w-48">Top Skills</th>
                    <th className="w-32">Pipeline</th>
                    <th className="w-32">Flags</th>
                    <th>Summary Evidence</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-[var(--text-muted)]">
                        No candidates match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c, i) => (
                      <CandidateRow 
                        key={c.candidate_id} 
                        candidate={c} 
                        index={i}
                        showSelectBox={true}
                        isSelected={selectedIds.includes(c.candidate_id)}
                        onSelectToggle={handleSelectToggle}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
