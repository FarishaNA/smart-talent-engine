/**
 * Smart Talent Engine — API client
 */

const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

// ── Jobs ──

export function createJob(title, description) {
  return request('/jobs', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}

export function deleteJob(jobId) {
  return request(`/jobs/${jobId}`, {
    method: 'DELETE',
  });
}

export function listJobs() {
  return request('/jobs');
}

export function getJob(jobId) {
  return request(`/jobs/${jobId}`);
}

// ── Resume Upload ──

export async function uploadResumes(jobId, files) {
  const form = new FormData();
  files.forEach(f => form.append('files', f));

  const res = await fetch(`${API_BASE}/jobs/${jobId}/resumes/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export function getResumeStatus(jobId) {
  return request(`/jobs/${jobId}/resumes/status`);
}

// ── Ranking ──

export function triggerRanking(jobId) {
  return request(`/jobs/${jobId}/rank`, { method: 'POST' });
}

export function getRanking(jobId) {
  return request(`/jobs/${jobId}/ranking`);
}

export function getHiddenGems(jobId) {
  return request(`/jobs/${jobId}/hidden-gems`);
}

// ── Candidates ──

export function getCandidate(candidateId) {
  return request(`/candidates/${candidateId}`);
}

export function deleteCandidate(candidateId) {
  return request(`/candidates/${candidateId}`, {
    method: 'DELETE'
  });
}

export function getCandidateResumeUrl(candidateId) {
  return `${API_BASE}/candidates/${candidateId}/resume`;
}

export function getCandidateScore(candidateId, jobId) {
  return request(`/candidates/${candidateId}/score/${jobId}`);
}

export function compareCandidates(candidateIds, jobId) {
  return request('/candidates/compare', {
    method: 'POST',
    body: JSON.stringify({ candidate_ids: candidateIds, job_id: jobId }),
  });
}

// ── Stats ──

export function getJobStats(jobId) {
  return request(`/jobs/${jobId}/stats`);
}

export function getGlobalStats() {
  return request('/stats');
}
