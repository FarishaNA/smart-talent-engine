import { Link } from 'react-router-dom';

export default function CandidateRow({ 
  candidate, 
  index, 
  isSelected, 
  onSelectToggle,
  showSelectBox 
}) {
  const getScorePillClass = (score) => {
    if (score >= 70) return 'score-pill-high';
    if (score >= 45) return 'score-pill-mid';
    return 'score-pill-low';
  };

  const getRankBadgeClass = (index) => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-default';
  };

  return (
    <tr className="hover:bg-[rgba(99,102,241,0.05)] transition-colors group">
      {/* Selection Box */}
      {showSelectBox && (
        <td className="w-12 text-center" onClick={(e) => e.stopPropagation()}>
          <div 
            className={`checkbox-custom ${isSelected ? 'checked' : ''} mx-auto`}
            onClick={() => onSelectToggle(candidate.candidate_id)}
          >
            {isSelected && <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M4.5 9L1.5 6L2.5 5L4.5 7L9.5 2L10.5 3L4.5 9Z"/></svg>}
          </div>
        </td>
      )}

      {/* Rank */}
      <td className="w-16">
        <div className={`rank-badge ${getRankBadgeClass(index)}`}>
          {index + 1}
        </div>
      </td>

      {/* Name & Confidence */}
      <td className="py-4">
        <div>
          <Link 
            to={`/candidates/${candidate.candidate_id}?job=${candidate.job_id}`}
            className="font-bold text-[var(--text-primary)] hover:text-[var(--accent-indigo)] text-base block mb-1"
          >
            {candidate.name}
          </Link>
          <div className="flex gap-2 items-center">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
              candidate.confidence_level === 'high' ? 'bg-emerald-500/10 text-emerald-400' :
              candidate.confidence_level === 'medium' ? 'bg-amber-500/10 text-amber-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {candidate.confidence_level} conf
            </span>
            {candidate.hiring_profile && (
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${candidate.hiring_profile.badge_class}`}>
                {candidate.hiring_profile.label}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Score */}
      <td>
        <span className={`score-pill ${getScorePillClass(candidate.compatibility_score)}`}>
          {candidate.compatibility_score.toFixed(0)}%
        </span>
      </td>

      {/* Top Skills */}
      <td className="w-64 max-w-[250px]">
        <div className="flex flex-wrap gap-1.5">
          {candidate.direct_matches.slice(0, 3).map((m, i) => (
            <span key={`d-${i}`} className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
              {m.label}
            </span>
          ))}
          {candidate.inferred_matches.slice(0, Math.max(0, 3 - candidate.direct_matches.length)).map((m, i) => (
            <span key={`i-${i}`} className="text-xs bg-[rgba(99,102,241,0.1)] border border-[var(--border-accent)] px-2 py-0.5 rounded text-[var(--accent-indigo)]" title={`Inferred via ${m.matched_via}`}>
              {m.label} <span className="opacity-50 ml-0.5">*</span>
            </span>
          ))}
          {(candidate.direct_matches.length + candidate.inferred_matches.length > 3) && (
            <span className="text-xs text-[var(--text-muted)] py-0.5">+{candidate.direct_matches.length + candidate.inferred_matches.length - 3}</span>
          )}
        </div>
      </td>

      {/* Pipeline Info */}
      <td className="w-32">
        <div className="flex flex-col gap-1 items-start">
          {candidate.retrieval_method === 'rag_retrieved' && (
            <span className="badge badge-indigo text-[9px] w-full max-w-full">RAG Retrieved</span>
          )}
          {candidate.llm_reranked && (
            <span className="badge badge-green text-[9px] w-full max-w-full">LLM Re-ranked</span>
          )}
        </div>
      </td>

      {/* Flags */}
      <td className="w-32">
        <div className="flex flex-col gap-1.5 items-start">
          {candidate.hidden_gem_flag && (
             <span className="badge badge-amber text-[10px] w-full max-w-full truncate block whitespace-nowrap overflow-hidden text-ellipsis" title={candidate.hidden_gem_type?.replace('_', ' ')}>
               🔮 Gem
             </span>
          )}
          {candidate.keyword_stuffing_flag && (
             <span className="badge badge-red text-[10px]">
               ⚠️ Stuffing
             </span>
          )}
        </div>
      </td>

      {/* Summary */}
      <td className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[280px]">
        {candidate.justification.split('.')[0]}.
        <Link 
          to={`/candidates/${candidate.candidate_id}?job=${candidate.job_id}`}
          className="text-[var(--accent-indigo)] ml-1 hover:underline"
        >
          Read more
        </Link>
      </td>
      
      {/* Actions */}
      <td className="text-right">
        <Link 
          to={`/candidates/${candidate.candidate_id}?job=${candidate.job_id}`}
          className="btn btn-secondary btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Deep Dive <span>→</span>
        </Link>
      </td>
    </tr>
  );
}
