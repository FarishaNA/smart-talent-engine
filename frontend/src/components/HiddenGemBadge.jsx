export default function HiddenGemBadge({ type, explanation }) {
  const titles = {
    terminology_mismatch: "Terminology Mismatch",
    hierarchy_mismatch: "Hierarchy Mismatch",
    context_mismatch: "Context Mismatch",
  };

  return (
    <div className="gem-section animate-in flex flex-col gap-2">
      <div className="gem-header mb-0">
        <span className="text-xl">🔮</span>
        <span>Hidden Gem Detected: {titles[type] || "Unconventional Profile"}</span>
      </div>
      <p className="text-sm italic text-[var(--accent-amber)] opacity-90 leading-relaxed ml-7">
        {explanation}
      </p>
    </div>
  );
}
