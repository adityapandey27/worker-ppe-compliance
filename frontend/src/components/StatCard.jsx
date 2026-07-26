import React from 'react';

const toneMap = {
  neutral: 'text-ink',
  amber: 'text-amber',
  danger: 'text-danger',
  ok: 'text-ok',
  accent: 'text-accent'
};

const StatCard = ({ label, value, tone = 'neutral' }) => (
  <div className="bg-green-200 rounded-xl border border-slate-800 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
    </div>
    <p className={`font-display text-3xl font-semibold ${toneMap[tone]}`}>{value}</p>
  </div>
);

export default StatCard;
