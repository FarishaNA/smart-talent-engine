import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Ranking from './pages/Ranking';
import CandidateDetail from './pages/CandidateDetail';
import Comparison from './pages/Comparison';

function Navbar() {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <nav className="ste-navbar">
      <Link to="/" className="ste-navbar-logo">
        {/* Graph node icon */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="13" stroke="url(#logoRing)" strokeWidth="1.5" fill="none" />
          <circle cx="14" cy="8" r="3" fill="url(#logoGrad)" />
          <circle cx="21" cy="18" r="3" fill="url(#logoGrad)" opacity="0.7" />
          <circle cx="7" cy="18" r="3" fill="url(#logoGrad)" opacity="0.7" />
          <line x1="14" y1="11" x2="20" y2="16" stroke="url(#logoGrad)" strokeWidth="1.25" strokeOpacity="0.6" />
          <line x1="14" y1="11" x2="8" y2="16" stroke="url(#logoGrad)" strokeWidth="1.25" strokeOpacity="0.6" />
          <line x1="8.5" y1="18" x2="19.5" y2="18" stroke="url(#logoGrad)" strokeWidth="1.25" strokeOpacity="0.4" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#87a330" />
              <stop offset="100%" stopColor="#a4c439" />
            </linearGradient>
            <linearGradient id="logoRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#87a330" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a4c439" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
        <div className="ste-navbar-logo-text">
          <span className="ste-navbar-logo-name">Smart Talent Engine</span>
          <span className="ste-navbar-logo-tag">Graph-Driven ATS</span>
        </div>
      </Link>

      <div className="ste-navbar-center">
        {!isDashboard && (
          <Link to="/" className="ste-navbar-breadcrumb">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Dashboard
          </Link>
        )}
      </div>

      <div className="ste-navbar-right">
        <div className="ste-navbar-status">
          <span className="ste-status-dot" />
          <span>AI Pipeline Active</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

        .ste-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 60px;
          background: rgba(253, 252, 251, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        .ste-navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .ste-navbar-logo-text {
          display: flex;
          flex-direction: column;
          gap: 0;
          line-height: 1;
        }
        .ste-navbar-logo-name {
          font-size: 0.9375rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #87a330 0%, #a4c439 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ste-navbar-logo-tag {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .ste-navbar-center {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ste-navbar-breadcrumb {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          padding: 0.35rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
          transition: all 0.15s;
        }
        .ste-navbar-breadcrumb:hover {
          color: var(--accent-indigo);
          border-color: rgba(135,163,48,0.25);
          background: rgba(135,163,48,0.05);
        }

        .ste-navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }
        .ste-navbar-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--text-muted);
        }
        .ste-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 2px rgba(22,163,74,0.2);
          animation: statusPulse 2.5s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(22,163,74,0.2); }
          50% { box-shadow: 0 0 0 4px rgba(22,163,74,0.1); }
        }

        /* ── Global App Shell ──────────────────────────── */
        .ste-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          font-family: 'DM Sans', -apple-system, sans-serif;
        }
        .ste-main {
          flex: 1;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
          padding: 0 2rem;
        }

        /* ── Global font import for all pages ──────────── */
        *, *::before, *::after { box-sizing: border-box; }
        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        @media (max-width: 768px) {
          .ste-navbar { padding: 0 1rem; }
          .ste-main { padding: 0 1rem; }
          .ste-navbar-status { display: none; }
        }
      `}</style>
    </nav>
  );
}

function AppShell() {
  return (
    <div className="ste-app">
      <Navbar />
      <main className="ste-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs/:jobId/upload" element={<Upload />} />
          <Route path="/jobs/:jobId/ranking" element={<Ranking />} />
          <Route path="/jobs/:jobId/compare" element={<Comparison />} />
          <Route path="/candidates/:candidateId" element={<CandidateDetail />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;