import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listJobs, createJob, getGlobalStats } from '../api';
import JobCard from '../components/JobCard';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        listJobs(),
        getGlobalStats()
      ]);
      setJobs(jobsRes.jobs || []);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDesc) return;
    setIsCreating(true);
    try {
      const res = await createJob(newJobTitle, newJobDesc);
      setIsModalOpen(false);
      setNewJobTitle('');
      setNewJobDesc('');
      navigate(`/jobs/${res.job_id}/upload`);
    } catch (err) {
      console.error(err);
      alert("Failed to create job.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job and all its data?")) return;
    try {
      await deleteJob(jobId);
      setJobs(jobs.filter(j => j.job_id !== jobId));
      // Refresh stats
      const statsRes = await getGlobalStats();
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job.");
    }
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 bg-[var(--gradient-primary)] bg-clip-text text-transparent w-max">
            Active Jobs
          </h1>
          <p className="text-[var(--text-secondary)]">Manage your open positions and talent pools.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
          New Job
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar mb-10">
          <div className="stat-card">
            <div className="stat-value">{stats.total_jobs}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_resumes}</div>
            <div className="stat-label">Resumes Processed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-[var(--accent-amber)]" style={{ background: 'none', WebkitTextFillColor: 'currentColor' }}>
              {stats.hidden_gems_count}
            </div>
            <div className="stat-label">Hidden Gems Found</div>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No active jobs</div>
          <p className="text-sm">Create a new job and upload a job description to get started.</p>
        </div>
      ) : (
        <div className="card-grid">
          {jobs.map(job => (
            <JobCard key={job.job_id} job={job} onDelete={handleDeleteJob} />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Job</h2>
            <form onSubmit={handleCreateJob} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Job Title</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="input" 
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Job Description</label>
                <textarea 
                  required
                  className="textarea" 
                  placeholder="Paste the full job description here. Mention specific years of experience, must-have skills, and nice-to-haves."
                  value={newJobDesc}
                  onChange={e => setNewJobDesc(e.target.value)}
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  The system will automatically parse this and extract the graph requirement nodes.
                </p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
