import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getRanking } from '../api';
import CandidateRow from '../components/CandidateRow';
import HiddenGemBadge from '../components/HiddenGemBadge';
import { TableRowSkeleton } from '../components/LoadingSkeleton';

export default function Ranking() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    try {
      const [jobData, rankingData] = await Promise.all([
        getJob(jobId),
        getRanking(jobId)
      ]);
      setJob(jobData);
      setCandidates(rankingData.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2 && selectedIds.length <= 3) {
      navigate(`/jobs/${jobId}/compare`, { state: { candidateIds: selectedIds } });
    } else {
      alert("Please select exactly 2 or 3 candidates to compare.");
    }
  };

  const handleExport = () => {
    const headers = ['Rank', 'Name', 'Score', 'Confidence', 'Hidden Gem', 'Top Skills'];
    const rows = filteredCandidates.map((c, i) => [
      i + 1,
      `"${c.name}"`,
      c.compatibility_score.toFixed(1),
      c.confidence_level,
      c.hidden_gem_flag ? 'Yes' : 'No',
      `"${c.direct_matches.map(m => m.label).join(', ')}"`
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
  }, [candidates, minScore, showGemsOnly, hideStuffing, typeFilter]);

  const hiddenGems = candidates.filter(c => c.hidden_gem_flag);
  const avgScore = candidates.length > 0
    ? (candidates.reduce((s, c) => s + c.compatibility_score, 0) / candidates.length).toFixed(1)
    : 0;
  const topScore = candidates.length > 0
    ? Math.max(...candidates.map(c => c.compatibility_score)).toFixed(1)
    : 0;

  return (
    <div className="ste-ranking page-enter">

      {/* ── Page Header ─────────────────────────────────────── */}
      <header className="ste-page-header">
        <div className="ste-page-header-left">
          <button onClick={() => navigate('/')} className="ste-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Dashboard
          </button>
          <div className="ste-page-title-block">
            <h1 className="ste-page-title">{job?.title || 'Job Ranking'}</h1>
            <p className="ste-page-subtitle">
              {isLoading ? 'Loading candidates…' : `${filteredCandidates.length} of ${candidates.length} candidates · Sorted by compatibility score`}
            </p>
          </div>
        </div>

        <div className="ste-page-header-actions">
          <button
            className={`ste-btn ${showJD ? 'ste-btn-accent' : 'ste-btn-ghost'}`}
            onClick={() => setShowJD(!showJD)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {showJD ? 'Hide JD' : 'View JD'}
          </button>
          <button className="ste-btn ste-btn-ghost" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          {selectedIds.length >= 2 && (
            <button className="ste-btn ste-btn-primary ste-compare-btn" onClick={handleCompare}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" /><rect x="14" y="3" width="7" height="18" />
              </svg>
              Compare {selectedIds.length}
            </button>
          )}
        </div>
      </header>

      {/* ── Stats Strip ─────────────────────────────────────── */}
      {!isLoading && candidates.length > 0 && (
        <div className="ste-stats-strip">
          <div className="ste-stat">
            <span className="ste-stat-value">{candidates.length}</span>
            <span className="ste-stat-label">Total Candidates</span>
          </div>
          <div className="ste-stat-divider" />
          <div className="ste-stat">
            <span className="ste-stat-value ste-stat-accent">{topScore}%</span>
            <span className="ste-stat-label">Top Score</span>
          </div>
          <div className="ste-stat-divider" />
          <div className="ste-stat">
            <span className="ste-stat-value">{avgScore}%</span>
            <span className="ste-stat-label">Avg Score</span>
          </div>
          <div className="ste-stat-divider" />
          <div className="ste-stat">
            <span className="ste-stat-value ste-stat-gem">✦ {hiddenGems.length}</span>
            <span className="ste-stat-label">Hidden Gems</span>
          </div>
          <div className="ste-stat-divider" />
          <div className="ste-stat">
            <span className="ste-stat-value">{filteredCandidates.length}</span>
            <span className="ste-stat-label">Showing</span>
          </div>
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="ste-body">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="ste-sidebar">

          <div className="ste-sidebar-section">
            <p className="ste-sidebar-label">Min Score</p>
            <div className="ste-score-range-display">
              <span className="ste-range-value">{minScore}%</span>
              <div className="ste-range-track">
                <div className="ste-range-fill" style={{ width: `${minScore}%` }} />
              </div>
            </div>
            <input
              type="range" min="0" max="100" value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="ste-range-input"
            />
          </div>

          <div className="ste-sidebar-sep" />

          <div className="ste-sidebar-section">
            <p className="ste-sidebar-label">Experience</p>
            <select
              className="ste-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="fresher">Fresher / Student</option>
              <option value="junior">Junior Professional</option>
              <option value="senior">Senior Professional</option>
            </select>
          </div>

          <div className="ste-sidebar-sep" />

          <div className="ste-sidebar-section">
            <p className="ste-sidebar-label">Flags</p>
            <div className="ste-toggle-list">
              <label className="ste-toggle-row">
                <div className={`ste-toggle ${showGemsOnly ? 'on' : ''}`} onClick={() => setShowGemsOnly(v => !v)}>
                  <div className="ste-toggle-thumb" />
                </div>
                <span>Hidden Gems Only</span>
              </label>
              <label className="ste-toggle-row">
                <div className={`ste-toggle ${hideStuffing ? 'on' : ''}`} onClick={() => setHideStuffing(v => !v)}>
                  <div className="ste-toggle-thumb" />
                </div>
                <span>Hide Keyword Stuffing</span>
              </label>
            </div>
          </div>

          <div className="ste-sidebar-sep" />

          <div className="ste-pipeline-info">
            <div className="ste-pipeline-title">
              <span className="ste-pipeline-dot" />
              Hybrid AI Pipeline
            </div>
            <ol className="ste-pipeline-steps">
              <li><span>01</span> Semantic Retrieval <em>Top 30</em></li>
              <li><span>02</span> LLM Skill Extraction</li>
              <li><span>03</span> Graph Scoring &amp; Validation</li>
              <li><span>04</span> LLM Reasoning Re-rank <em>Top 10</em></li>
            </ol>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────── */}
        <div className="ste-main">

          {/* JD Card */}
          {showJD && job && (
            <div className="ste-jd-card">
              <div className="ste-jd-header">
                <div className="ste-jd-title">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Job Description
                </div>
                <button className="ste-jd-close" onClick={() => setShowJD(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="ste-jd-body">{job.description}</div>
            </div>
          )}

          {/* Table */}
          <div className="ste-table-card">
            <div className="ste-table-scroll">
              <table className="ste-table">
                <thead>
                  <tr>
                    <th className="ste-th-check" />
                    <th className="ste-th-rank">#</th>
                    <th>Candidate</th>
                    <th>Score</th>
                    <th>Top Skills</th>
                    <th>Pipeline</th>
                    <th>Flags</th>
                    <th>Summary</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={9} />
                    ))
                  ) : filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="ste-empty-row">
                        <div className="ste-empty-state">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                          </svg>
                          <p>No candidates match current filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c, i) => (
                      <CandidateRow
                        key={c.candidate_id}
                        candidate={c}
                        index={i}
                        jobId={jobId}
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

      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        /* ─── Layout ─────────────────────────────────────── */
        .ste-ranking {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: calc(100vh - 64px);
          padding: 2rem 2.5rem 4rem;
          font-family: 'DM Sans', 'Inter', sans-serif;
        }

        /* ─── Page Header ──────────────────────────────── */
        .ste-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 1.75rem;
        }
        .ste-page-header-left { display: flex; flex-direction: column; gap: 0.625rem; }
        .ste-back-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em;
          color: var(--text-muted, #888); background: none; border: none;
          cursor: pointer; padding: 0; transition: color 0.15s;
        }
        .ste-back-btn:hover { color: var(--accent-indigo); }
        .ste-page-title {
          font-size: 1.625rem; font-weight: 700; letter-spacing: -0.03em;
          color: var(--text-primary); margin: 0; line-height: 1.2;
        }
        .ste-page-subtitle {
          font-size: 0.8rem; color: var(--text-muted, #999); margin: 0;
          letter-spacing: 0.01em;
        }

        .ste-page-header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

        /* ─── Buttons ──────────────────────────────────── */
        .ste-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 0.875rem; border-radius: 0.5rem; font-size: 0.8125rem;
          font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
          letter-spacing: 0.01em; white-space: nowrap;
        }
        .ste-btn-ghost {
          background: var(--bg-secondary); color: var(--text-primary);
          border: 1px solid var(--border-subtle);
        }
        .ste-btn-ghost:hover { background: var(--border-subtle); }
        .ste-btn-accent {
          background: rgba(135,163,48,0.12); color: var(--accent-indigo);
          border: 1px solid rgba(135,163,48,0.3);
        }
        .ste-btn-primary {
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          color: #fff; box-shadow: 0 2px 8px rgba(135,163,48,0.35);
        }
        .ste-btn-primary:hover { filter: brightness(1.07); box-shadow: 0 4px 14px rgba(135,163,48,0.45); }
        .ste-compare-btn { animation: fadeSlideIn 0.2s ease; }
        @keyframes fadeSlideIn { from { opacity:0; transform: translateX(6px); } to { opacity:1; transform:none; } }

        /* ─── Stats Strip ──────────────────────────────── */
        .ste-stats-strip {
          display: flex; align-items: center; gap: 0;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 0.75rem; padding: 0 0.5rem;
          margin-bottom: 1.5rem; overflow: hidden;
        }
        .ste-stat {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.15rem; padding: 0.875rem 1.5rem;
        }
        .ste-stat-value {
          font-size: 1.25rem; font-weight: 700; letter-spacing: -0.03em;
          color: var(--text-primary); line-height: 1;
        }
        .ste-stat-accent { color: var(--accent-indigo); }
        .ste-stat-gem { color: #d4a831; }
        .ste-stat-label {
          font-size: 0.7rem; font-weight: 500; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-muted, #999);
        }
        .ste-stat-divider { width: 1px; height: 2rem; background: var(--border-subtle); flex-shrink: 0; }

        /* ─── Body ─────────────────────────────────────── */
        .ste-body {
          display: flex; gap: 1.25rem; align-items: flex-start; flex: 1;
        }

        /* ─── Sidebar ──────────────────────────────────── */
        .ste-sidebar {
          width: 220px; flex-shrink: 0;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 0.875rem; padding: 1.25rem;
          position: sticky; top: 1rem;
        }
        .ste-sidebar-section { display: flex; flex-direction: column; gap: 0.625rem; }
        .ste-sidebar-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-muted, #999);
        }
        .ste-sidebar-sep { height: 1px; background: var(--border-subtle); margin: 0.75rem 0; }

        .ste-score-range-display {
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.5rem;
        }
        .ste-range-value {
          font-size: 1rem; font-weight: 700; letter-spacing: -0.02em;
          color: var(--accent-indigo); min-width: 2.5rem;
        }
        .ste-range-track {
          flex: 1; height: 4px; background: var(--border-subtle);
          border-radius: 99px; overflow: hidden;
        }
        .ste-range-fill {
          height: 100%; background: var(--accent-indigo);
          border-radius: 99px; transition: width 0.1s;
        }
        .ste-range-input {
          width: 100%; margin: 0; accent-color: var(--accent-indigo);
          cursor: pointer;
        }

        .ste-select {
          width: 100%; background: var(--bg-secondary);
          border: 1px solid var(--border-subtle); border-radius: 0.5rem;
          padding: 0.5rem 0.625rem; font-size: 0.8rem; color: var(--text-primary);
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.625rem center;
        }

        .ste-toggle-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .ste-toggle-row {
          display: flex; align-items: center; gap: 0.625rem;
          font-size: 0.8rem; cursor: pointer; color: var(--text-primary);
          user-select: none;
        }
        .ste-toggle {
          width: 32px; height: 18px; background: var(--bg-secondary);
          border: 1px solid var(--border-subtle); border-radius: 99px;
          position: relative; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .ste-toggle.on { background: var(--accent-indigo); border-color: var(--accent-indigo); }
        .ste-toggle-thumb {
          position: absolute; left: 2px; top: 50%; transform: translateY(-50%);
          width: 12px; height: 12px; border-radius: 50%; background: #fff;
          transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .ste-toggle.on .ste-toggle-thumb { left: 16px; }

        .ste-pipeline-info {
          background: rgba(135,163,48,0.04);
          border: 1px solid rgba(135,163,48,0.15);
          border-radius: 0.625rem; padding: 0.875rem;
        }
        .ste-pipeline-title {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 700; color: var(--accent-indigo);
          margin-bottom: 0.625rem; letter-spacing: 0.01em;
        }
        .ste-pipeline-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent-indigo);
          box-shadow: 0 0 0 3px rgba(135,163,48,0.2);
        }
        .ste-pipeline-steps {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.375rem;
        }
        .ste-pipeline-steps li {
          display: flex; gap: 0.5rem; align-items: baseline;
          font-size: 0.73rem; color: var(--text-secondary, #555);
        }
        .ste-pipeline-steps li span {
          font-size: 0.65rem; font-weight: 700; color: var(--accent-indigo);
          opacity: 0.6; min-width: 1.25rem;
        }
        .ste-pipeline-steps li em {
          font-style: normal; font-size: 0.65rem;
          color: var(--text-muted, #999); margin-left: auto;
        }

        /* ─── Main Content ─────────────────────────────── */
        .ste-main { flex: 1; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }

        /* ─── JD Card ──────────────────────────────────── */
        .ste-jd-card {
          background: var(--bg-card);
          border: 1px solid rgba(135,163,48,0.2);
          border-radius: 0.875rem; overflow: hidden;
          animation: fadeSlideDown 0.2s ease;
        }
        @keyframes fadeSlideDown { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform:none; } }
        .ste-jd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(135,163,48,0.03);
        }
        .ste-jd-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--accent-indigo);
        }
        .ste-jd-close {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted, #999); padding: 0.25rem;
          border-radius: 0.375rem; transition: all 0.15s; display: flex;
        }
        .ste-jd-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
        .ste-jd-body {
          padding: 1.25rem; font-size: 0.8rem; line-height: 1.75;
          color: var(--text-secondary, #555); white-space: pre-wrap;
          max-height: 320px; overflow-y: auto;
        }

        /* ─── Table Card ───────────────────────────────── */
        .ste-table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 0.875rem; overflow: hidden;
        }
        .ste-table-scroll { overflow-x: auto; }
        .ste-table {
          width: 100%; border-collapse: collapse; table-layout: auto;
          font-size: 0.8125rem;
        }
        .ste-table thead tr {
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
        }
        .ste-table th {
          padding: 0.75rem 1rem; text-align: left;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-muted, #999);
          white-space: nowrap;
        }
        .ste-th-check { width: 44px; }
        .ste-th-rank { width: 48px; }

        .ste-table tbody tr {
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.12s;
        }
        .ste-table tbody tr:last-child { border-bottom: none; }
        .ste-table tbody tr:hover { background: rgba(135,163,48,0.03); }

        .ste-empty-row { padding: 3rem 1rem; }
        .ste-empty-state {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          color: var(--text-muted, #999);
        }
        .ste-empty-state p { font-size: 0.85rem; margin: 0; }
      `}</style>
    </div>
  );
}