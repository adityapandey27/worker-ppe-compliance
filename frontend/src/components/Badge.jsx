import React from 'react';

const styles = {
  pending: 'bg-amber/10 text-amber border-amber/30',
  acknowledged: 'bg-ok/10 text-ok border-ok/30',
  escalated: 'bg-danger/10 text-danger border-danger/30',
  High: 'bg-danger/10 text-danger border-danger/30',
  Medium: 'bg-amber/10 text-amber border-amber/30',
  Low: 'bg-accent/10 text-accent border-accent/30'
};

const Badge = ({ children, type }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
    {children}
  </span>
);

export default Badge;
