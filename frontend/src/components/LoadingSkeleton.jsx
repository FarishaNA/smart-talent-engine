import React from 'react';

/* ── Shared shimmer keyframe ─────────────────────────────── */
const shimmerStyle = `
  @keyframes skeletonShimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .skel {
    background: linear-gradient(
      90deg,
      var(--bg-secondary) 25%,
      rgba(229, 217, 201, 0.5) 50%,
      var(--bg-secondary) 75%
    );
    background-size: 800px 100%;
    animation: skeletonShimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }
`;

/* ── Card Skeleton ──────────────────────────────────────── */
export const CardSkeleton = () => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '1rem',
    padding: '1.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }}>
    <style>{shimmerStyle}</style>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div className="skel" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div className="skel" style={{ height: 12, width: '55%' }} />
        <div className="skel" style={{ height: 10, width: '30%' }} />
      </div>
    </div>

    <div className="skel" style={{ height: 15, width: '75%' }} />

    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '0.625rem',
      padding: '0.75rem',
      display: 'flex',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div className="skel" style={{ height: 18, width: 32 }} />
        <div className="skel" style={{ height: 8, width: 48 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
        <div className="skel" style={{ height: 18, width: 36 }} />
        <div className="skel" style={{ height: 8, width: 48 }} />
      </div>
    </div>

    <div className="skel" style={{ height: 36, width: '100%', borderRadius: 10 }} />
  </div>
);

/* ── Table Row Skeleton ──────────────────────────────────── */
export const TableRowSkeleton = ({ cols = 5 }) => {
  const widths = ['32px', '100%', '64px', '80px', '64px', '56px', '56px', '160px', '80px'];
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <style>{shimmerStyle}</style>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0.875rem 1rem' }}>
          <div
            className="skel"
            style={{ height: 14, width: widths[i] || '80px', maxWidth: '100%' }}
          />
        </td>
      ))}
    </tr>
  );
};

/* ── Score Skeleton ──────────────────────────────────────── */
export const ScoreSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <style>{shimmerStyle}</style>
    <div className="skel" style={{ width: 64, height: 64, borderRadius: '50%' }} />
    <div className="skel" style={{ height: 12, width: 48 }} />
  </div>
);

/* ── Detail Header Skeleton ──────────────────────────────── */
export const DetailHeaderSkeleton = () => (
  <div style={{ marginBottom: '1.75rem' }}>
    <style>{shimmerStyle}</style>

    {/* Top bar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
      <div className="skel" style={{ height: 32, width: 72, borderRadius: 8 }} />
      <div className="skel" style={{ height: 28, width: 80, borderRadius: 999 }} />
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
        <div className="skel" style={{ height: 34, width: 110, borderRadius: 8 }} />
        <div className="skel" style={{ height: 34, width: 80, borderRadius: 8 }} />
      </div>
    </div>

    {/* Three column grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', gap: '1.25rem' }}>
      {/* Left col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '0.875rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skel" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div className="skel" style={{ height: 16, width: '70%' }} />
              <div className="skel" style={{ height: 11, width: '50%' }} />
            </div>
          </div>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="skel" style={{ height: 11, width: '40%' }} />
              <div className="skel" style={{ height: 11, width: '25%' }} />
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '0.875rem', padding: '1.25rem' }}>
          <div className="skel" style={{ height: 11, width: '60%', marginBottom: '0.875rem' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {[80, 60, 96, 72, 56, 84].map((w, i) => (
              <div key={i} className="skel" style={{ height: 24, width: w, borderRadius: 5 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Center col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '0.875rem', padding: '1.25rem' }}>
          <div className="skel" style={{ height: 11, width: '45%', marginBottom: '1rem' }} />
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.625rem', padding: '0.875rem', marginBottom: '1.25rem' }}>
            <div className="skel" style={{ height: 11, width: '35%', marginBottom: '0.625rem' }} />
            <div className="skel" style={{ height: 13, width: '100%', marginBottom: '0.35rem' }} />
            <div className="skel" style={{ height: 13, width: '85%' }} />
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="skel" style={{ height: 13, width: '30%' }} />
              <div className="skel" style={{ height: 20, width: 60, borderRadius: 999 }} />
              <div className="skel" style={{ height: 13, flex: 1 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '0.875rem', padding: '1.25rem' }}>
          <div className="skel" style={{ height: 11, width: '55%', marginBottom: '0.875rem' }} />
          <div className="skel" style={{ height: 80, width: '100%', borderRadius: 10, marginBottom: '0.625rem' }} />
          <div className="skel" style={{ height: 13, width: '50%' }} />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '0.875rem', padding: '1.25rem' }}>
          <div className="skel" style={{ height: 11, width: '50%', marginBottom: '0.875rem' }} />
          <div className="skel" style={{ height: 200, width: '100%', borderRadius: 10 }} />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '0.875rem', padding: '1.25rem' }}>
          <div className="skel" style={{ height: 11, width: '45%', marginBottom: '0.875rem' }} />
          {['Strong Match', 'Partial', 'Missing'].map(s => (
            <div key={s} style={{ marginBottom: '0.875rem' }}>
              <div className="skel" style={{ height: 10, width: '30%', marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {[64, 80, 56].map((w, i) => (
                  <div key={i} className="skel" style={{ height: 22, width: w, borderRadius: 5 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);