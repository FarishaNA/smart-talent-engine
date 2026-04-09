import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function JobCard({ job, onDelete }) {
  const isRanked = job.status === 'ranked';
  const isParsing = job.status === 'parsing' || job.status === 'extracting_skills';
  
  return (
    <div className="card relative group">
      <button 
        onClick={() => onDelete(job.job_id)}
        className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[var(--accent-rose)]/[.1] rounded-lg transition-all opacity-0 group-hover:opacity-100"
        title="Delete Job"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>

      <h3 className="section-title mb-2 text-xl truncate pr-8" title={job.title}>
        {job.title}
      </h3>
      
      <div className="flex gap-2 mb-4">
        {job.status === 'created' && <span className="badge badge-indigo">Created</span>}
        {isParsing && <span className="badge badge-blue">Parsing...</span>}
        {job.status === 'parsed' && <span className="badge badge-blue">Ready</span>}
        {isRanked && <span className="badge badge-green">Ranked</span>}
        
        {job.hidden_gem_count > 0 && (
          <span className="badge badge-amber shrink-0 flex items-center gap-1">
            <span>🔮</span> {job.hidden_gem_count} hidden gems
          </span>
        )}
      </div>
      
      <div className="text-sm text-secondary mb-6 flex justify-between items-center bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-subtle)]">
        <div>
          <div className="font-semibold text-[var(--text-primary)]">
            {job.resume_count} 
          </div>
          <div className="text-xs uppercase tracking-wider mt-1 text-[var(--text-muted)]">Resumes</div>
        </div>
        
        {isRanked && job.top_score && (
          <div className="text-right">
            <div className="font-semibold text-[var(--accent-emerald)]">
              {job.top_score.toFixed(0)}%
            </div>
            <div className="text-xs uppercase tracking-wider mt-1 text-[var(--text-muted)]">Top Match</div>
          </div>
        )}
      </div>
      
      <div className="flex gap-3">
        {isRanked ? (
          <>
            <Link to={`/jobs/${job.job_id}/ranking`} className="btn btn-primary flex-1 justify-center">
              View Rankings
            </Link>
            <Link to={`/jobs/${job.job_id}/upload`} className="btn btn-secondary text-sm">
              + More
            </Link>
          </>
        ) : (
          <Link to={`/jobs/${job.job_id}/upload`} className="btn btn-primary flex-1 justify-center">
            Upload Resumes
          </Link>
        )}
      </div>
    </div>
  );
}
