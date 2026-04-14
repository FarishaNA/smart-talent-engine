import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { getJob, uploadResumes, getResumeStatus, triggerRanking } from '../api';

export default function Upload() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [files, setFiles] = useState([]);
  const [statusFeed, setStatusFeed] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRanking, setIsRanking] = useState(false);

  useEffect(() => {
    loadJob();
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const loadJob = async () => {
    try { const data = await getJob(jobId); setJob(data); }
    catch (e) { console.error(e); }
  };

  const pollStatus = async () => {
    try { const data = await getResumeStatus(jobId); setStatusFeed(data); }
    catch (e) { console.error(e); }
  };

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    }
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    try { await uploadResumes(jobId, files); setFiles([]); pollStatus(); }
    catch (e) { console.error("Upload error", e); alert("Failed to upload files"); }
    finally { setIsUploading(false); }
  };

  const handleRank = async () => {
    setIsRanking(true);
    try { await triggerRanking(jobId); navigate(`/jobs/${jobId}/ranking`); }
    catch (e) { console.error("Ranking error", e); alert("Failed to rank candidates"); setIsRanking(false); }
  };

  const isAllComplete = statusFeed && statusFeed.total > 0 && statusFeed.in_progress === 0;
  const progressPct = statusFeed && statusFeed.total > 0
    ? ((statusFeed.completed + statusFeed.failed) / statusFeed.total) * 100
    : 0;

  const getStatusIcon = (status) => {
    if (status === 'complete') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
    if (status === 'failed') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
    return <div className="ste-upload-spinner" style={{ borderTopColor: status === 'extracting_skills' ? '#0ea5e9' : 'var(--accent-indigo)' }} />;
  };

  const getStatusLabel = (item) => {
    if (item.error) return item.error;
    const map = {
      queued: 'Queued…',
      parsing: 'Parsing layout…',
      extracting_skills: 'Extracting skills from graph…',
      complete: `${item.skills_found} skills extracted`,
    };
    return map[item.status] || item.status;
  };

  return (
    <div className="ste-upload">

      {/* ── Page Header ─────────────────────────────────── */}
      <header className="ste-upload-header">
        <button onClick={() => navigate('/')} className="ste-upload-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Dashboard
        </button>
        <div>
          <h1 className="ste-upload-title">{job?.title || 'Loading…'}</h1>
          <p className="ste-upload-sub">Upload candidate resumes · the engine parses and scores automatically</p>
        </div>
      </header>

      {/* ── Two Column Layout ───────────────────────────── */}
      <div className="ste-upload-grid">

        {/* ── Left: Drop Zone ─────────────────────────── */}
        <div className="ste-upload-col">
          <div className="ste-col-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Zone
          </div>

          <div
            {...getRootProps()}
            className={`ste-dropzone ${isDragActive ? 'active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
          >
            <input {...getInputProps()} />

            {files.length === 0 ? (
              <div className="ste-dropzone-empty">
                <div className="ste-dropzone-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 12 15 15" />
                  </svg>
                </div>
                <div className="ste-dropzone-headline">
                  {isDragActive ? 'Release to upload' : 'Drop resumes here'}
                </div>
                <div className="ste-dropzone-hint">or click to browse files</div>
                <div className="ste-dropzone-formats">PDF · DOCX · DOC · JPG · PNG</div>
              </div>
            ) : (
              <div className="ste-file-list" onClick={e => e.stopPropagation()}>
                <div className="ste-file-list-header">
                  <span className="ste-file-list-count">{files.length} file{files.length > 1 ? 's' : ''} ready</span>
                  <button
                    className="ste-file-clear"
                    onClick={e => { e.stopPropagation(); setFiles([]); }}
                  >Clear all</button>
                </div>
                <div className="ste-files-scroll">
                  {files.map((f, i) => (
                    <div key={i} className="ste-file-item">
                      <div className="ste-file-icon">
                        {f.name.endsWith('.pdf') ? '📄' : f.name.match(/\.(jpg|jpeg|png)$/i) ? '🖼' : '📝'}
                      </div>
                      <div className="ste-file-name" title={f.name}>{f.name}</div>
                      <div className="ste-file-size">{(f.size / 1024).toFixed(0)}kb</div>
                      <button
                        className="ste-file-remove"
                        onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, fi) => fi !== i)); }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {files.length > 0 && (
            <button
              className="ste-upload-btn"
              onClick={e => { e.stopPropagation(); handleUpload(); }}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="ste-upload-spinner white" />
                  Uploading…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload {files.length} File{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          )}

          {/* Drop-zone tip */}
          <div className="ste-upload-tip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            For best results, include resumes with clear skill sections. Max 10MB per file.
          </div>
        </div>

        {/* ── Right: Status Feed ───────────────────────── */}
        <div className="ste-upload-col">
          <div className="ste-col-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Processing Status
            {statusFeed?.total > 0 && (
              <span className="ste-feed-count">
                {statusFeed.completed + statusFeed.failed} / {statusFeed.total}
              </span>
            )}
          </div>

          <div className="ste-status-panel">
            {/* Progress Bar */}
            {statusFeed?.total > 0 && (
              <div className="ste-status-progress-wrap">
                <div className="ste-status-progress-track">
                  <div
                    className="ste-status-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="ste-status-pct">{progressPct.toFixed(0)}%</span>
              </div>
            )}

            {/* Feed */}
            <div className="ste-feed-scroll">
              {!statusFeed || statusFeed.items.length === 0 ? (
                <div className="ste-feed-empty">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>Awaiting uploads…</span>
                </div>
              ) : (
                statusFeed.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`ste-feed-item ${item.status}`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="ste-feed-icon">{getStatusIcon(item.status)}</div>
                    <div className="ste-feed-body">
                      <div className="ste-feed-name" title={item.filename}>{item.filename}</div>
                      <div className={`ste-feed-status ${item.error ? 'error' : ''}`}>
                        {getStatusLabel(item)}
                      </div>
                    </div>
                    {item.status === 'complete' && (
                      <div className="ste-feed-complete-badge">✓</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Rank CTA */}
            <div className={`ste-rank-cta ${isAllComplete ? 'ready' : ''}`}>
              <div className="ste-rank-cta-info">
                {isAllComplete ? (
                  <>
                    <div className="ste-rank-ready-dot" />
                    <span>All {statusFeed.total} resumes processed — ready to rank</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {statusFeed?.in_progress > 0
                      ? `${statusFeed.in_progress} resume${statusFeed.in_progress > 1 ? 's' : ''} still processing…`
                      : 'Upload resumes to begin'}
                  </span>
                )}
              </div>
              <button
                className={`ste-rank-btn ${isAllComplete ? 'active' : 'disabled'}`}
                disabled={!isAllComplete || isRanking}
                onClick={handleRank}
              >
                {isRanking ? (
                  <>
                    <div className="ste-upload-spinner white" />
                    Ranking Candidates…
                  </>
                ) : (
                  <>
                    Run AI Ranking
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        .ste-upload {
          font-family: 'DM Sans', -apple-system, sans-serif;
          padding: 2rem 0 4rem;
        }

        .ste-upload-header { margin-bottom: 2rem; }
        .ste-upload-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: none; border: none; cursor: pointer;
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em;
          color: var(--text-muted); padding: 0; margin-bottom: 0.75rem;
          transition: color 0.15s;
        }
        .ste-upload-back:hover { color: var(--accent-indigo); }
        .ste-upload-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 1.875rem; font-weight: 400; letter-spacing: -0.03em;
          color: var(--text-primary); margin-bottom: 0.25rem;
        }
        .ste-upload-sub { font-size: 0.83rem; color: var(--text-muted); }

        .ste-upload-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 860px) { .ste-upload-grid { grid-template-columns: 1fr; } }

        .ste-upload-col { display: flex; flex-direction: column; gap: 0.875rem; }
        .ste-col-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .ste-feed-count {
          margin-left: auto; font-size: 0.72rem; font-weight: 600;
          color: var(--accent-indigo); background: rgba(135,163,48,0.1);
          padding: 0.15rem 0.5rem; border-radius: 99px;
        }

        /* ─ Drop Zone ─────────────────────────────────── */
        .ste-dropzone {
          background: var(--bg-card); border: 2px dashed var(--border-subtle);
          border-radius: 1rem; min-height: 340px; cursor: pointer;
          transition: all 0.2s ease; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .ste-dropzone:hover, .ste-dropzone.active {
          border-color: var(--accent-indigo);
          background: rgba(135,163,48,0.02);
        }
        .ste-dropzone.active { border-style: solid; }
        .ste-dropzone.has-files { cursor: default; }

        .ste-dropzone-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 0.625rem;
          padding: 3rem 2rem; text-align: center; flex: 1;
        }
        .ste-dropzone-icon-wrap {
          width: 64px; height: 64px; border-radius: 16px;
          background: rgba(135,163,48,0.08); border: 1px solid rgba(135,163,48,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-indigo); margin-bottom: 0.375rem;
          transition: all 0.2s;
        }
        .ste-dropzone:hover .ste-dropzone-icon-wrap, .ste-dropzone.active .ste-dropzone-icon-wrap {
          background: rgba(135,163,48,0.12); transform: scale(1.05);
        }
        .ste-dropzone-headline { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .ste-dropzone-hint { font-size: 0.83rem; color: var(--text-muted); }
        .ste-dropzone-formats {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted); opacity: 0.7;
          margin-top: 0.25rem;
        }

        .ste-file-list { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .ste-file-list-header {
          display: flex; align-items: center; justify-content: space-between;
        }
        .ste-file-list-count { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }
        .ste-file-clear {
          font-size: 0.73rem; color: #ef4444; background: none; border: none;
          cursor: pointer; font-weight: 600; padding: 0;
        }
        .ste-file-clear:hover { text-decoration: underline; }
        .ste-files-scroll { display: flex; flex-direction: column; gap: 0.375rem; max-height: 240px; overflow-y: auto; }
        .ste-file-item {
          display: flex; align-items: center; gap: 0.625rem;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          border-radius: 0.5rem; padding: 0.5rem 0.75rem;
          animation: fileIn 0.2s ease;
        }
        @keyframes fileIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
        .ste-file-icon { font-size: 1rem; flex-shrink: 0; }
        .ste-file-name {
          flex: 1; font-size: 0.78rem; font-weight: 600; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ste-file-size { font-size: 0.68rem; color: var(--text-muted); flex-shrink: 0; }
        .ste-file-remove {
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          padding: 0.2rem; display: flex; border-radius: 4px; transition: all 0.12s;
        }
        .ste-file-remove:hover { color: #ef4444; background: rgba(239,68,68,0.08); }

        .ste-upload-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem; border-radius: 0.75rem; border: none; cursor: pointer;
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          color: white; font-size: 0.9rem; font-weight: 700;
          box-shadow: 0 2px 12px rgba(135,163,48,0.3);
          transition: all 0.15s;
        }
        .ste-upload-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(135,163,48,0.4); }
        .ste-upload-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .ste-upload-tip {
          display: flex; align-items: flex-start; gap: 0.5rem;
          font-size: 0.73rem; color: var(--text-muted); line-height: 1.55;
          padding: 0.625rem 0.75rem; background: var(--bg-secondary);
          border: 1px solid var(--border-subtle); border-radius: 0.5rem;
        }

        /* ─ Status Panel ──────────────────────────────── */
        .ste-status-panel {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 1rem; overflow: hidden;
          display: flex; flex-direction: column;
          min-height: 340px;
        }

        .ste-status-progress-wrap {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
        }
        .ste-status-progress-track {
          flex: 1; height: 5px; background: var(--border-subtle);
          border-radius: 99px; overflow: hidden;
        }
        .ste-status-progress-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, #87a330, #a4c439);
          transition: width 0.5s ease;
        }
        .ste-status-pct { font-size: 0.72rem; font-weight: 700; color: var(--accent-indigo); min-width: 2.25rem; text-align: right; }

        .ste-feed-scroll {
          flex: 1; overflow-y: auto; padding: 0.875rem;
          display: flex; flex-direction: column; gap: 0.375rem;
        }
        .ste-feed-empty {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 0.75rem; padding: 3rem 1rem;
          font-size: 0.83rem; color: var(--text-muted); text-align: center;
        }

        .ste-feed-item {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.625rem 0.75rem; border-radius: 0.5rem;
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          animation: feedIn 0.25s ease both;
          transition: border-color 0.2s;
        }
        .ste-feed-item.complete { border-color: rgba(22,163,74,0.15); background: rgba(22,163,74,0.03); }
        .ste-feed-item.failed { border-color: rgba(239,68,68,0.15); background: rgba(239,68,68,0.03); }
        @keyframes feedIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        .ste-feed-icon {
          width: 22px; height: 22px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ste-feed-body { flex: 1; min-width: 0; }
        .ste-feed-name {
          font-size: 0.78rem; font-weight: 600; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 0.1rem;
        }
        .ste-feed-status { font-size: 0.7rem; color: var(--text-muted); }
        .ste-feed-status.error { color: #ef4444; }
        .ste-feed-complete-badge {
          font-size: 0.65rem; font-weight: 800; color: #16a34a;
          background: rgba(22,163,74,0.1); padding: 0.15rem 0.4rem;
          border-radius: 4px; flex-shrink: 0;
        }

        /* ─ Rank CTA ──────────────────────────────────── */
        .ste-rank-cta {
          border-top: 1px solid var(--border-subtle);
          padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;
          background: var(--bg-secondary); transition: background 0.3s;
        }
        .ste-rank-cta.ready { background: rgba(22,163,74,0.03); }
        .ste-rank-cta-info {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.78rem; color: var(--text-secondary);
        }
        .ste-rank-ready-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #16a34a;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.2); flex-shrink: 0;
          animation: pulseDot 1.5s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 3px rgba(22,163,74,0.2); }
          50% { box-shadow: 0 0 0 5px rgba(22,163,74,0.1); }
        }
        .ste-rank-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem; border-radius: 0.75rem; border: none; cursor: pointer;
          font-size: 0.9rem; font-weight: 700; transition: all 0.2s;
        }
        .ste-rank-btn.active {
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          color: white; box-shadow: 0 2px 12px rgba(22,163,74,0.3);
        }
        .ste-rank-btn.active:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(22,163,74,0.4); }
        .ste-rank-btn.disabled {
          background: var(--border-subtle); color: var(--text-muted); cursor: not-allowed;
        }

        /* ─ Spinner ───────────────────────────────────── */
        .ste-upload-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(135,163,48,0.25);
          border-top-color: var(--accent-indigo);
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        .ste-upload-spinner.white {
          border-color: rgba(255,255,255,0.25); border-top-color: white;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}