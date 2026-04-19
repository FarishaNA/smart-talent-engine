import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

// ── Custom Tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '0.625rem',
      padding: '0.625rem 0.875rem',
      fontSize: '0.75rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        marginBottom: '0.375rem',
      }}>
        {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{entry.name}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 800, color: entry.color, paddingLeft: '0.5rem' }}>
            {typeof entry.value === 'number' ? `${Math.round(entry.value)}%` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Custom Legend ─────────────────────────────────────────
const CustomLegend = ({ payload }) => {
  if (!payload) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '1.25rem', paddingTop: '0.875rem',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{
            width: 10, height: 3, borderRadius: 999,
            background: entry.color, flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em',
            color: 'var(--text-muted)',
          }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RadarChart({ data, candidateName }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: 200, gap: '0.75rem',
        color: 'var(--text-muted)', fontSize: '0.82rem',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>No domain data available</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 380 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          cx="50%"
          cy="46%"
          outerRadius="62%"
          data={data}
          margin={{ top: 16, right: 36, bottom: 16, left: 36 }}
        >
          <PolarGrid
            stroke="var(--border-subtle)"
            strokeOpacity={0.6}
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="domain"
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.03em',
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            gridType="polygon"
          />

          {/* Requirement baseline */}
          <Radar
            name="Job Requirements"
            dataKey="required"
            stroke="var(--border-subtle)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="var(--bg-secondary)"
            fillOpacity={0.25}
            isAnimationActive={false}
          />

          {/* Candidate coverage */}
          <Radar
            name={candidateName || 'Candidate'}
            dataKey="candidate"
            stroke="var(--accent-indigo)"
            strokeWidth={2.5}
            fill="var(--accent-indigo)"
            fillOpacity={0.18}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
            dot={{
              fill: 'var(--accent-indigo)',
              r: 3,
              strokeWidth: 0,
            }}
            activeDot={{
              fill: 'var(--accent-indigo)',
              r: 5,
              stroke: 'var(--bg-card)',
              strokeWidth: 2,
            }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}