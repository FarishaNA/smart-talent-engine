import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function JobCard({ job, onDelete, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const isRanked = job.status === 'ranked';
  const isParsing = job.status === 'parsing' || job.status === 'extracting_skills';

  const getStatusConfig = () => {
    if (isRanked) return { label: 'Ranked', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)' };
    if (isParsing) return { label: 'Processing…', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)' };
    if (job.status === 'parsed') return { label: 'Ready', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)' };
    return { label: 'Created', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' };
  };

  const status = getStatusConfig();
  // Deterministic "icon" from job title initial
  const initials = job.title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

  return (
    <div
      className="ste-job-card"
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button */}
      <button
        className={`ste-job-delete ${hovered ? 'visible' : ''}`}
        onClick={() => onDelete(job.job_id)}
        title="Delete job"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>

      {/* Card top */}
      <div className="ste-job-card-top">
        <div className="ste-job-avatar">{initials}</div>
        <div className="ste-job-badges">
          <span className="ste-job-status-chip" style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>
            {isParsing && <span className="ste-job-spinner" />}
            {status.label}
          </span>
          {job.hidden_gem_count > 0 && (
            <span className="ste-job-gem-chip">
              ✦ {job.hidden_gem_count} gem{job.hidden_gem_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="ste-job-title" title={job.title}>{job.title}</h3>

      {/* Stats strip */}
      <div className="ste-job-stats">
        <div className="ste-job-stat">
          <span className="ste-job-stat-val">{job.resume_count}</span>
          <span className="ste-job-stat-lbl">Resumes</span>
        </div>
        {isRanked && job.top_score != null && (
          <>
            <div className="ste-job-stat-sep" />
            <div className="ste-job-stat">
              <span className="ste-job-stat-val" style={{ color: '#16a34a' }}>
                {job.top_score.toFixed(0)}%
              </span>
              <span className="ste-job-stat-lbl">Top Match</span>
            </div>
          </>
        )}
        {isRanked && job.avg_score != null && (
          <>
            <div className="ste-job-stat-sep" />
            <div className="ste-job-stat">
              <span className="ste-job-stat-val">{job.avg_score.toFixed(0)}%</span>
              <span className="ste-job-stat-lbl">Avg Score</span>
            </div>
          </>
        )}
      </div>

      {/* Score bar (if ranked) */}
      {isRanked && job.top_score != null && (
        <div className="ste-job-score-bar">
          <div className="ste-job-score-fill" style={{ width: `${job.top_score}%` }} />
        </div>
      )}

      {/* Actions */}
      <div className="ste-job-actions">
        {isRanked ? (
          <>
            <Link to={`/jobs/${job.job_id}/ranking`} className="ste-job-btn-primary">
              View Rankings
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to={`/jobs/${job.job_id}/upload`} className="ste-job-btn-ghost">
              + More
            </Link>
          </>
        ) : (
          <Link to={`/jobs/${job.job_id}/upload`} className="ste-job-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            Upload Resumes
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <style>{`
        .ste-job-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 1rem;
          padding: 1.375rem;
          display: flex; flex-direction: column; gap: 1rem;
          transition: all 0.22s ease;
          animation: cardReveal 0.4s ease both;
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        .ste-job-card:hover {
          border-color: rgba(135,163,48,0.3);
          box-shadow: 0 8px 28px rgba(135,163,48,0.1), 0 2px 8px rgba(0,0,0,0.04);
          transform: translateY(-2px);
        }

        .ste-job-delete {
          position: absolute; top: 1rem; right: 1rem;
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 0.375rem; border-radius: 0.5rem;
          display: flex; opacity: 0; transition: all 0.15s;
        }
        .ste-job-delete.visible { opacity: 1; }
        .ste-job-delete:hover { color: #ef4444; background: rgba(239,68,68,0.08); }

        .ste-job-card-top { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
        .ste-job-avatar {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          background: rgba(135,163,48,0.1); border: 1px solid rgba(135,163,48,0.2);
          color: var(--accent-indigo); font-size: 0.875rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          letter-spacing: -0.02em;
        }
        .ste-job-badges { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
        .ste-job-status-chip {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase; padding: 0.2rem 0.55rem; border-radius: 99px;
        }
        .ste-job-spinner {
          width: 7px; height: 7px; border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: currentColor;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ste-job-gem-chip {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em;
          padding: 0.2rem 0.55rem; border-radius: 99px;
          background: rgba(217,119,6,0.08); color: #d97706;
          border: 1px solid rgba(217,119,6,0.2);
        }

        .ste-job-title {
          font-size: 1.0625rem; font-weight: 700; letter-spacing: -0.025em;
          color: var(--text-primary); line-height: 1.3;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          padding-right: 1.5rem;
        }

        .ste-job-stats {
          display: flex; align-items: center; gap: 0;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          border-radius: 0.625rem; padding: 0 0.25rem;
        }
        .ste-job-stat {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.1rem; padding: 0.625rem 1rem;
        }
        .ste-job-stat-val {
          font-size: 1.0625rem; font-weight: 800; letter-spacing: -0.03em;
          color: var(--text-primary); line-height: 1;
        }
        .ste-job-stat-lbl {
          font-size: 0.62rem; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .ste-job-stat-sep { width: 1px; height: 1.5rem; background: var(--border-subtle); }

        .ste-job-score-bar {
          height: 3px; border-radius: 99px; background: var(--border-subtle); overflow: hidden;
        }
        .ste-job-score-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, #87a330, #a4c439);
          transition: width 0.8s ease;
        }

        .ste-job-actions { display: flex; gap: 0.5rem; }
        .ste-job-btn-primary {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.55rem 1.125rem; border-radius: 0.625rem;
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          color: white; font-size: 0.8125rem; font-weight: 700;
          text-decoration: none; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(135,163,48,0.25);
        }
        .ste-job-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(135,163,48,0.35); }
        .ste-job-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.55rem 0.875rem; border-radius: 0.625rem;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          color: var(--text-secondary); font-size: 0.8125rem; font-weight: 600;
          text-decoration: none; transition: all 0.15s;
        }
        .ste-job-btn-ghost:hover { border-color: var(--border-accent); color: var(--accent-indigo); }
      `}</style>
    </div>
  );
}