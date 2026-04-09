import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Ranking from './pages/Ranking';
import CandidateDetail from './pages/CandidateDetail';
import Comparison from './pages/Comparison';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        Smart Talent Engine
      </Link>
      <div className="flex gap-4 items-center">
        <span className="text-sm font-medium text-[var(--text-muted)]">Graph-Driven ATS</span>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs/:jobId/upload" element={<Upload />} />
            <Route path="/jobs/:jobId/ranking" element={<Ranking />} />
            <Route path="/jobs/:jobId/compare" element={<Comparison />} />
            <Route path="/candidates/:candidateId" element={<CandidateDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
