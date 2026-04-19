export default function HiddenGemBadge({ type, explanation }) {
  const config = {
    terminology_mismatch: {
      label: 'Terminology Mismatch',
      sub: 'Uses different words for the same skills',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    hierarchy_mismatch: {
      label: 'Hierarchy Mismatch',
      sub: 'Senior skills in an unexpected role tier',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    context_mismatch: {
      label: 'Context Mismatch',
      sub: 'Transferable skills from adjacent domain',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M13 6h3a2 2 0 0 1 2 2v7" />
          <path d="M11 18H8a2 2 0 0 1-2-2V9" />
        </svg>
      ),
    },
  };

  const c = config[type] || {
    label: 'Unconventional Profile',
    sub: 'Unique background worth investigating',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  };

  return (
    <div className="ste-gem-badge animate-in">
      <div className="ste-gem-shimmer" aria-hidden="true" />

      <div className="ste-gem-header">
        <div className="ste-gem-icon-wrap">
          {c.icon}
        </div>
        <div>
          <div className="ste-gem-title">✦ Hidden Gem Detected</div>
          <div className="ste-gem-type">{c.label}</div>
        </div>
        <div className="ste-gem-orb" aria-hidden="true">✦</div>
      </div>

      <p className="ste-gem-explanation">{explanation}</p>

      <div className="ste-gem-footer">
        <span className="ste-gem-sub-label">{c.sub}</span>
      </div>

      <style>{`
        .ste-gem-badge {
          position: relative;
          background: rgba(245, 158, 11, 0.04);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 0.875rem;
          padding: 1.125rem;
          overflow: hidden;
        }

        .ste-gem-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(245, 158, 11, 0.04) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: gemShimmer 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes gemShimmer {
          0%   { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }

        .ste-gem-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          position: relative;
        }

        .ste-gem-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d97706;
          flex-shrink: 0;
        }

        .ste-gem-title {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #d97706;
          margin-bottom: 0.1rem;
        }

        .ste-gem-type {
          font-size: 0.8375rem;
          font-weight: 700;
          color: #92400e;
          letter-spacing: -0.01em;
        }

        .ste-gem-orb {
          margin-left: auto;
          font-size: 1.25rem;
          color: rgba(245, 158, 11, 0.3);
          animation: orbFloat 2.5s ease-in-out infinite alternate;
          line-height: 1;
        }
        @keyframes orbFloat {
          from { transform: translateY(-2px); opacity: 0.3; }
          to   { transform: translateY(2px);  opacity: 0.6; }
        }

        .ste-gem-explanation {
          font-size: 0.8125rem;
          line-height: 1.65;
          color: #78350f;
          margin: 0 0 0.75rem 0;
          padding-left: 0.125rem;
          position: relative;
        }

        .ste-gem-footer {
          padding-top: 0.625rem;
          border-top: 1px solid rgba(245, 158, 11, 0.12);
        }

        .ste-gem-sub-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(146, 64, 14, 0.6);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}