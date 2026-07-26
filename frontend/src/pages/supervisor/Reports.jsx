import React, { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const SupervisorReports = () => {
  const [filters, setFilters] = useState({ status: '', department: '', from: '', to: '' });
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

      const res = await api.get('/reports/violations/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `violations-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout title="Reports" subtitle="Export the violations list for offline review or compliance records">
      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl">
        <h2 className="font-display font-semibold text-base mb-1">Export violations (CSV)</h2>
        <p className="text-sm text-muted mb-5">Optionally narrow the export using the filters below, then download.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Department</label>
            <input
              placeholder="e.g. Maintenance"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">From</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">To</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={downloading}
          className="mt-6 bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent/90 disabled:opacity-60"
        >
          {downloading ? 'Preparing file...' : 'Download CSV'}
        </button>
      </div>
    </Layout>
  );
};

export default SupervisorReports;
