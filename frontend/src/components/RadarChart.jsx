import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function RadarChart({ data, candidateName }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[400px] flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart 
          cx="50%" 
          cy="45%" 
          outerRadius="65%" 
          data={data}
          margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
        >
          <PolarGrid stroke="var(--border-subtle)" strokeOpacity={0.5} />
          <PolarAngleAxis 
            dataKey="domain" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false}
            axisLine={false}
          />
          
          <Radar
            name="Job Requirements"
            dataKey="required"
            stroke="var(--border-subtle)"
            strokeWidth={1}
            fill="var(--bg-secondary)"
            fillOpacity={0.2}
            isAnimationActive={true}
          />
          
          <Radar
            name={candidateName || "Candidate"}
            dataKey="candidate"
            stroke="var(--accent-indigo)"
            strokeWidth={3}
            fill="var(--accent-indigo)"
            fillOpacity={0.5}
            isAnimationActive={true}
            animationDuration={1500}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(8px)',
              borderColor: 'var(--border-accent)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ 
              paddingTop: '30px',
              fontSize: '12px',
              fontWeight: '600'
            }} 
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
