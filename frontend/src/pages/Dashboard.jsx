import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listJobs, createJob, deleteJob, getGlobalStats } from '../api';
import JobCard from '../components/JobCard';

// ── Scroll Reveal Hook ────────────────────────────────────────
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Animated Counter ──────────────────────────────────────────
function Counter({ target, duration = 1400 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useScrollReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target, duration]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dashboardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    setTimeout(() => setHeroVisible(true), 80);
  }, []);

  const loadData = async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([listJobs(), getGlobalStats()]);
      setJobs(jobsRes.jobs || []);
      setStats(statsRes);
    } catch (err) { console.error("Failed to load dashboard data", err); }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDesc) return;
    setIsCreating(true);
    try {
      const res = await createJob(newJobTitle, newJobDesc);
      setIsModalOpen(false);
      setNewJobTitle(''); setNewJobDesc('');
      navigate(`/jobs/${res.job_id}/upload`);
    } catch (err) { console.error(err); alert("Failed to create job."); }
    finally { setIsCreating(false); }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this job and all its data?")) return;
    try {
      await deleteJob(jobId);
      setJobs(jobs.filter(j => j.job_id !== jobId));
      const statsRes = await getGlobalStats();
      setStats(statsRes);
    } catch (err) { alert("Failed to delete job."); }
  };

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ste-dashboard">

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className={`ste-hero ${heroVisible ? 'visible' : ''}`}>
        {/* Background texture */}
        <div className="ste-hero-bg" aria-hidden="true">
          <div className="ste-hero-blob blob-1" />
          <div className="ste-hero-blob blob-2" />
          <div className="ste-hero-grid" />
        </div>

        <div className="ste-hero-inner">
          <div className="ste-hero-eyebrow">
            <span className="ste-hero-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
              Graph-Driven AI · Zero Cost Ranking
            </span>
          </div>

          <h1 className="ste-hero-title">
            Smarter Hiring with<br />
            <em>Graph-Driven</em><br />
            AI Intelligence
          </h1>

          <p className="ste-hero-sub">
            Semantic resume matching beyond keyword filters.<br />
            Discover hidden talent your competitors overlook.
          </p>

          <div className="ste-hero-actions">
            <button className="ste-cta-primary" onClick={() => { scrollToDashboard(); setTimeout(() => setIsModalOpen(true), 600); }}>
              Start Hiring Smarter
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="ste-cta-ghost" onClick={scrollToDashboard}>
              View Jobs
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
          </div>

          {/* Metric pills */}
          {stats && (
            <div className="ste-hero-metrics">
              <div className="ste-hero-metric">
                <span className="ste-hero-metric-val"><Counter target={stats.total_resumes || 0} /></span>
                <span className="ste-hero-metric-lbl">Resumes Processed</span>
              </div>
              <div className="ste-hero-metric-sep" />
              <div className="ste-hero-metric">
                <span className="ste-hero-metric-val"><Counter target={stats.total_jobs || 0} /></span>
                <span className="ste-hero-metric-lbl">Active Jobs</span>
              </div>
              <div className="ste-hero-metric-sep" />
              <div className="ste-hero-metric">
                <span className="ste-hero-metric-val ste-amber"><Counter target={stats.hidden_gems_count || 0} /></span>
                <span className="ste-hero-metric-lbl">Hidden Gems Found</span>
              </div>
              <div className="ste-hero-metric-sep" />
              <div className="ste-hero-metric">
                <span className="ste-hero-metric-val ste-green">{stats.avg_top_score ? `${stats.avg_top_score.toFixed(0)}%` : '—'}</span>
                <span className="ste-hero-metric-lbl">Avg Top Accuracy</span>
              </div>
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <button className="ste-scroll-cue" onClick={scrollToDashboard} aria-label="Scroll to jobs">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </section>

      {/* ── Dashboard Content ───────────────────────────────── */}
      <section className="ste-dashboard-body" ref={dashboardRef}>

        {/* Header Row */}
        <div className="ste-db-header">
          <div>
            <h2 className="ste-db-title">Active Jobs</h2>
            <p className="ste-db-sub">Manage open positions and talent pools</p>
          </div>
          <div className="ste-db-header-right">
            {/* Search */}
            <div className="ste-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search jobs…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ste-search-input"
              />
            </div>
            <button className="ste-new-job-btn" onClick={() => setIsModalOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Job
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="ste-stats-row">
            {[
              { label: 'Active Jobs', value: stats.total_jobs, icon: '🗂', accent: false },
              { label: 'Resumes Processed', value: stats.total_resumes, icon: '📄', accent: false },
              { label: 'Hidden Gems', value: stats.hidden_gems_count, icon: '✦', accent: 'amber' },
              { label: 'Top Accuracy', value: stats.avg_top_score ? `${stats.avg_top_score.toFixed(0)}%` : '—', icon: '🎯', accent: 'green' },
            ].map((s, i) => (
              <StatCard key={i} {...s} delay={i * 80} />
            ))}
          </div>
        )}

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="ste-empty">
            <div className="ste-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <div className="ste-empty-title">{searchQuery ? 'No jobs match your search' : 'No active jobs yet'}</div>
            <p>Create your first job to start ranking candidates.</p>
            {!searchQuery && (
              <button className="ste-new-job-btn" style={{ marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>
                Create First Job
              </button>
            )}
          </div>
        ) : (
          <div className="ste-jobs-grid">
            {filteredJobs.map((job, i) => (
              <JobCard key={job.job_id} job={job} onDelete={handleDeleteJob} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Create Job Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="ste-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="ste-modal" onClick={e => e.stopPropagation()}>
            <div className="ste-modal-header">
              <h2 className="ste-modal-title">Create New Job</h2>
              <button className="ste-modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="ste-modal-form">
              <div className="ste-field">
                <label className="ste-field-label">Job Title</label>
                <input
                  autoFocus required type="text"
                  className="ste-field-input"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                />
              </div>
              <div className="ste-field">
                <label className="ste-field-label">Job Description</label>
                <textarea
                  required className="ste-field-textarea"
                  placeholder="Paste the full job description here. Include specific years of experience, must-have skills, and nice-to-haves for best results."
                  value={newJobDesc}
                  onChange={e => setNewJobDesc(e.target.value)}
                />
                <p className="ste-field-hint">
                  The engine will automatically extract requirement graph nodes from this description.
                </p>
              </div>
              <div className="ste-modal-actions">
                <button type="button" className="ste-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="ste-new-job-btn" disabled={isCreating}>
                  {isCreating ? 'Creating…' : 'Create & Continue →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

        .ste-dashboard {
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        /* ─── Hero ──────────────────────────────────────── */
        .ste-hero {
          position: relative;
          min-height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 4rem 2rem 6rem;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .ste-hero.visible { opacity: 1; transform: none; }

        .ste-hero-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
        }
        .ste-hero-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
        }
        .blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #87a330 0%, transparent 70%);
          top: -200px; left: -150px;
          animation: blobDrift 12s ease-in-out infinite alternate;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #a4c439 0%, transparent 70%);
          bottom: -100px; right: -100px;
          animation: blobDrift 16s ease-in-out infinite alternate-reverse;
        }
        @keyframes blobDrift {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, 20px) scale(1.08); }
        }
        .ste-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(135,163,48,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(135,163,48,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%);
        }

        .ste-hero-inner {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; max-width: 760px;
        }

        .ste-hero-eyebrow { margin-bottom: 1.5rem; }
        .ste-hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.375rem 0.875rem; border-radius: 99px;
          background: rgba(135,163,48,0.1); border: 1px solid rgba(135,163,48,0.25);
          color: var(--accent-indigo); font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        .ste-hero-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(2.75rem, 6vw, 4.5rem);
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }
        .ste-hero-title em {
          font-style: italic;
          background: linear-gradient(135deg, #87a330 0%, #a4c439 60%, #c5d96a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ste-hero-sub {
          font-size: 1.0625rem; line-height: 1.7;
          color: var(--text-secondary); margin-bottom: 2.5rem;
          max-width: 500px;
        }

        .ste-hero-actions {
          display: flex; align-items: center; gap: 0.875rem;
          margin-bottom: 3.5rem; flex-wrap: wrap; justify-content: center;
        }
        .ste-cta-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1.75rem; border-radius: 0.75rem; border: none; cursor: pointer;
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          color: white; font-size: 0.9375rem; font-weight: 700;
          box-shadow: 0 4px 20px rgba(135,163,48,0.4), 0 1px 3px rgba(0,0,0,0.08);
          transition: all 0.2s ease; letter-spacing: -0.01em;
        }
        .ste-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(135,163,48,0.45), 0 2px 6px rgba(0,0,0,0.1);
        }
        .ste-cta-ghost {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem; border-radius: 0.75rem; cursor: pointer;
          background: transparent; border: 1px solid var(--border-subtle);
          color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;
          transition: all 0.2s ease;
        }
        .ste-cta-ghost:hover { border-color: var(--accent-indigo); color: var(--accent-indigo); background: rgba(135,163,48,0.04); }

        .ste-hero-metrics {
          display: flex; align-items: center; gap: 0;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 1rem; padding: 0 0.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .ste-hero-metric {
          display: flex; flex-direction: column; align-items: center; gap: 0.1rem;
          padding: 0.875rem 1.75rem;
        }
        .ste-hero-metric-val {
          font-size: 1.625rem; font-weight: 800; letter-spacing: -0.04em;
          color: var(--text-primary); line-height: 1;
        }
        .ste-hero-metric-val.ste-amber { color: #d97706; }
        .ste-hero-metric-val.ste-green { color: #16a34a; }
        .ste-hero-metric-lbl {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .ste-hero-metric-sep { width: 1px; height: 2rem; background: var(--border-subtle); }

        .ste-scroll-cue {
          position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: none; border: 1px solid var(--border-subtle); color: var(--text-muted);
          width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; animation: scrollBounce 2.5s ease-in-out infinite;
        }
        .ste-scroll-cue:hover { border-color: var(--accent-indigo); color: var(--accent-indigo); }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(5px); }
        }

        /* ─── Dashboard Body ────────────────────────────── */
        .ste-dashboard-body {
          padding: 3.5rem 0 4rem;
        }

        .ste-db-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;
        }
        .ste-db-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 2rem; font-weight: 400; letter-spacing: -0.03em;
          color: var(--text-primary); margin-bottom: 0.25rem;
        }
        .ste-db-sub { font-size: 0.85rem; color: var(--text-muted); }
        .ste-db-header-right { display: flex; align-items: center; gap: 0.625rem; }

        .ste-search-wrap {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 0.625rem; padding: 0.5rem 0.875rem;
          color: var(--text-muted);
        }
        .ste-search-input {
          border: none; background: none; outline: none;
          font-size: 0.8125rem; color: var(--text-primary); width: 180px;
        }
        .ste-search-input::placeholder { color: var(--text-muted); }

        .ste-new-job-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.55rem 1.125rem; border-radius: 0.625rem; border: none; cursor: pointer;
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          color: white; font-size: 0.8375rem; font-weight: 700; letter-spacing: -0.01em;
          box-shadow: 0 2px 10px rgba(135,163,48,0.3);
          transition: all 0.15s ease;
        }
        .ste-new-job-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(135,163,48,0.4); }
        .ste-new-job-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* ─── Stats Row ─────────────────────────────────── */
        .ste-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem; margin-bottom: 2rem;
        }
        @media (max-width: 900px) { .ste-stats-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .ste-stats-row { grid-template-columns: 1fr; } }

        .ste-stat-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 0.875rem; padding: 1.25rem 1.5rem;
          display: flex; align-items: center; gap: 1rem;
          transition: all 0.2s ease;
          opacity: 0; transform: translateY(12px);
        }
        .ste-stat-card.revealed {
          animation: statReveal 0.45s ease forwards;
        }
        @keyframes statReveal {
          to { opacity: 1; transform: none; }
        }
        .ste-stat-card:hover { border-color: var(--border-accent); box-shadow: 0 4px 16px rgba(135,163,48,0.08); }
        .ste-stat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(135,163,48,0.08); display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
        }
        .ste-stat-val {
          font-size: 1.5rem; font-weight: 800; letter-spacing: -0.04em;
          color: var(--text-primary); line-height: 1;
        }
        .ste-stat-val.amber { color: #d97706; }
        .ste-stat-val.green { color: #16a34a; }
        .ste-stat-lbl {
          font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-muted); margin-top: 0.2rem;
        }

        /* ─── Jobs Grid ─────────────────────────────────── */
        .ste-jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.125rem;
        }

        /* ─── Empty State ───────────────────────────────── */
        .ste-empty {
          text-align: center; padding: 5rem 2rem;
          color: var(--text-muted);
        }
        .ste-empty-icon { margin-bottom: 1rem; }
        .ste-empty-title { font-size: 1rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.375rem; }
        .ste-empty p { font-size: 0.85rem; }

        /* ─── Modal ─────────────────────────────────────── */
        .ste-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(17, 24, 9, 0.55);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
          padding: 1rem;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ste-modal {
          background: var(--bg-card); border-radius: 1.125rem;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 24px 64px rgba(0,0,0,0.15);
          width: 100%; max-width: 540px;
          animation: modalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        .ste-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.5rem 1.5rem 0;
        }
        .ste-modal-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 1.375rem; font-weight: 400; letter-spacing: -0.02em;
        }
        .ste-modal-close {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 0.375rem; border-radius: 0.5rem;
          display: flex; transition: all 0.15s;
        }
        .ste-modal-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
        .ste-modal-form { padding: 1.25rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .ste-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .ste-field-label { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.04em; color: var(--text-secondary); }
        .ste-field-input {
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          border-radius: 0.625rem; padding: 0.625rem 0.875rem;
          font-size: 0.875rem; color: var(--text-primary); outline: none;
          transition: border-color 0.15s;
        }
        .ste-field-input:focus { border-color: var(--accent-indigo); box-shadow: 0 0 0 3px rgba(135,163,48,0.1); }
        .ste-field-textarea {
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          border-radius: 0.625rem; padding: 0.625rem 0.875rem;
          font-size: 0.875rem; color: var(--text-primary); outline: none;
          resize: vertical; min-height: 130px; font-family: inherit;
          transition: border-color 0.15s;
        }
        .ste-field-textarea:focus { border-color: var(--accent-indigo); box-shadow: 0 0 0 3px rgba(135,163,48,0.1); }
        .ste-field-hint { font-size: 0.73rem; color: var(--text-muted); line-height: 1.5; margin-top: 0.25rem; }
        .ste-modal-actions { display: flex; justify-content: flex-end; gap: 0.625rem; padding-top: 0.5rem; }
        .ste-btn-ghost {
          background: none; border: 1px solid var(--border-subtle);
          color: var(--text-secondary); border-radius: 0.625rem;
          padding: 0.55rem 1rem; font-size: 0.8375rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .ste-btn-ghost:hover { background: var(--bg-secondary); }
      `}</style>
    </div>
  );
}

// ── Stat Card with scroll reveal ──────────────────────────────
function StatCard({ label, value, icon, accent, delay }) {
  const [ref, visible] = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`ste-stat-card ${visible ? 'revealed' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ste-stat-icon">{icon}</div>
      <div>
        <div className={`ste-stat-val ${accent || ''}`}>{value}</div>
        <div className="ste-stat-lbl">{label}</div>
      </div>
    </div>
  );
}