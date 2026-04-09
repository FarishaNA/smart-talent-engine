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
    try {
      const data = await getJob(jobId);
      setJob(data);
    } catch (e) {
      console.error(e);
    }
  };

  const pollStatus = async () => {
    try {
      const data = await getResumeStatus(jobId);
      setStatusFeed(data);
    } catch (e) {
      console.error(e);
    }
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
    try {
      await uploadResumes(jobId, files);
      setFiles([]);
      pollStatus(); // immediate poll
    } catch (e) {
      console.error("Upload error", e);
      alert("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRank = async () => {
    setIsRanking(true);
    try {
      await triggerRanking(jobId);
      navigate(`/jobs/${jobId}/ranking`);
    } catch (e) {
      console.error("Ranking error", e);
      alert("Failed to rank candidates");
      setIsRanking(false);
    }
  };

  const isAllComplete = statusFeed && statusFeed.total > 0 && statusFeed.in_progress === 0;

  return (
    <div className="animate-in pb-10">
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="btn btn-ghost !px-0 mb-4 opacity-70 hover:opacity-100">
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-2">{job?.title || 'Loading Job...'}</h1>
        <p className="text-[var(--text-secondary)]">Upload candidate resumes. The engine will parse and extract skills automatically.</p>
      </div>

      <div className="two-col h-[calc(100vh-250px)] min-h-[500px]">
        
        {/* Left Column: Upload Zone */}
        <div className="flex flex-col">
          <h2 className="section-title">Upload Zone</h2>
          <div className="card flex-1 flex flex-col justify-between h-full bg-[var(--bg-secondary)] border-dashed border-2 hover:border-[var(--accent-indigo)]">
            
            <div 
              {...getRootProps()} 
              className={`dropzone flex-1 flex flex-col items-center justify-center border-none ${isDragActive ? 'dropzone-active' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="dropzone-icon">📄</div>
              <div className="dropzone-text font-semibold text-lg mb-2">
                {isDragActive ? "Drop resumes here!" : "Drag & drop resumes here, or click to browse"}
              </div>
              <div className="dropzone-hint">
                Supported formats: PDF, DOCX, JPG, PNG. Max 10MB per file.
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-medium text-sm">
                    {files.length} file{files.length > 1 ? 's' : ''} ready to upload
                  </div>
                  <button className="text-xs text-[var(--accent-rose)] hover:underline" onClick={(e) => { e.stopPropagation(); setFiles([]); }}>
                    Clear all
                  </button>
                </div>
                <button 
                  className="btn btn-primary w-full justify-center py-3"
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : `Upload ${files.length} Files`}
                </button>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: Status Feed */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title m-0">Real-time Status Feed</h2>
            <div className="text-sm font-medium">
              {statusFeed?.total ? `${statusFeed.completed + statusFeed.failed} / ${statusFeed.total} processed` : 'No files yet'}
            </div>
          </div>
          
          <div className="card flex-1 flex flex-col overflow-hidden p-0">
            {/* Progress Bar */}
            {statusFeed && statusFeed.total > 0 && (
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[rgba(17,24,39,0.3)]">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((statusFeed.completed + statusFeed.failed) / statusFeed.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {!statusFeed || statusFeed.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
                  <div className="text-4xl mb-3">📡</div>
                  <p>Awaiting uploads...</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {statusFeed.items.map((item, idx) => (
                    <div key={idx} className="status-item animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="status-icon">
                        {item.status === 'queued' && <div className="status-spinner status-spinner-grey opacity-50" />}
                        {item.status === 'parsing' && <div className="status-spinner" />}
                        {item.status === 'extracting_skills' && <div className="status-spinner border-t-[var(--accent-cyan)]" />}
                        {item.status === 'complete' && <span className="text-[var(--accent-emerald)]">✓</span>}
                        {item.status === 'failed' && <span className="text-[var(--accent-rose)]">✗</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" title={item.filename}>{item.filename}</div>
                        {item.error ? (
                          <div className="text-xs text-[var(--accent-rose)] mt-0.5">{item.error}</div>
                        ) : (
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {item.status === 'queued' && 'Queued...'}
                            {item.status === 'parsing' && 'Parsing layout...'}
                            {item.status === 'extracting_skills' && 'Extracting skills...'}
                            {item.status === 'complete' && `Complete — ${item.skills_found} skills found`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Run Ranking CTA (appears when complete) */}
            <div className={`p-4 border-t border-[var(--border-subtle)] transition-all ${isAllComplete ? 'bg-[rgba(16,185,129,0.05)]' : 'bg-[var(--bg-card)]'}`}>
              <button 
                className={`btn w-full justify-center py-3 text-base ${isAllComplete ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                disabled={!isAllComplete || isRanking}
                onClick={handleRank}
              >
                {isRanking ? 'Ranking Candidates (Zero Cost)...' : isAllComplete ? 'Run Ranking & Find Matches' : 'Waiting for processing...'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
