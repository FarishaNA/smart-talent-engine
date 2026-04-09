import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function RadarChart({ data, candidateName }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="var(--border-subtle)" />
          <PolarAngleAxis 
            dataKey="domain" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickCount={5}
          />
          
          <Radar
            name="Job Requirements"
            dataKey="required"
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            fill="var(--bg-secondary)"
            fillOpacity={0.3}
          />
          
          <Radar
            name={candidateName || "Candidate"}
            dataKey="candidate"
            stroke="var(--accent-indigo)"
            strokeWidth={2}
            fill="var(--accent-indigo)"
            fillOpacity={0.4}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(17, 24, 39, 0.95)', 
              borderColor: 'var(--border-accent)',
              borderRadius: '0.75rem',
              color: 'var(--text-primary)'
            }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
