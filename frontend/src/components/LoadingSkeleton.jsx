import React from 'react';

export const CardSkeleton = () => (
  <div className="card animate-pulse border-[var(--border-subtle)] bg-[var(--bg-card)]">
    <div className="h-6 w-2/3 bg-[var(--bg-secondary)] rounded-md mb-4"></div>
    <div className="h-4 w-full bg-[var(--bg-secondary)] rounded-md mb-2"></div>
    <div className="h-4 w-5/6 bg-[var(--bg-secondary)] rounded-md mb-4"></div>
    <div className="flex gap-2 mt-auto">
      <div className="h-8 w-20 bg-[var(--bg-secondary)] rounded-full"></div>
      <div className="h-8 w-20 bg-[var(--bg-secondary)] rounded-full"></div>
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="animate-pulse border-b border-[var(--border-subtle)]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <div className={`h-4 bg-[var(--bg-secondary)] rounded-md ${i === 0 ? 'w-8' : i === 1 ? 'w-full' : 'w-24'}`}></div>
      </td>
    ))}
  </tr>
);

export const ScoreSkeleton = () => (
  <div className="animate-pulse flex flex-col items-center">
    <div className="h-16 w-16 bg-[var(--bg-secondary)] rounded-full mb-2"></div>
    <div className="h-4 w-12 bg-[var(--bg-secondary)] rounded-md"></div>
  </div>
);

export const DetailHeaderSkeleton = () => (
  <div className="animate-pulse mb-8 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
    <div className="h-32 w-full bg-[var(--gradient-primary)] opacity-10"></div>
    <div className="p-8 -mt-16 relative">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="h-32 w-32 bg-[var(--bg-secondary)] rounded-2xl border-4 border-white shadow-xl"></div>
        <div className="flex-1 mt-16 md:mt-0">
          <div className="h-8 w-64 bg-[var(--bg-secondary)] rounded-md mb-4"></div>
          <div className="flex gap-2 mb-6">
            <div className="h-6 w-24 bg-[var(--bg-secondary)] rounded-full"></div>
            <div className="h-6 w-24 bg-[var(--bg-secondary)] rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-xl bg-[var(--bg-secondary)] opacity-50">
             <div className="h-10 w-full bg-white/50 rounded-lg"></div>
             <div className="h-10 w-full bg-white/50 rounded-lg"></div>
             <div className="h-10 w-full bg-white/50 rounded-lg"></div>
             <div className="h-10 w-full bg-white/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
