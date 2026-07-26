import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import api from '../../api/axios';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      setMetrics(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s to reflect new simulated events
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Admin Dashboard" subtitle="Workforce & compliance overview across all sites">
      {loading ? (
        <p className="text-muted text-sm">Loading metrics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-2">
            <StatCard label="Active Workers" value={metrics.totalWorkers} />
            <StatCard label="Supervisors" value={metrics.totalSupervisors} />
            <StatCard label="Violations Today" value={metrics.violationsToday} />
            <StatCard label="Pending (Site-wide)" value={metrics.pendingViolations} />
            <StatCard
              label="Escalated Alerts"
              value={metrics.escalatedAlerts}              hint=">10 min unacknowledged"
            />
            <StatCard label="Response Rate" value={`${metrics.complianceResponseRate}%`}  />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-display font-semibold text-base mb-1">Today's snapshot</h2>
              <p className="text-sm text-muted mb-4">Acknowledged vs. still pending, refreshed automatically.</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-display font-semibold text-ok">{metrics.acknowledgedToday}</p>
                  <p className="text-xs text-muted">acknowledged today</p>
                </div>
                <div className="h-10 w-px bg-slate-200"></div>
                <div>
                  <p className="text-2xl font-display font-semibold text-amber">{metrics.pendingViolations}</p>
                  <p className="text-xs text-muted">still pending site-wide</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-display font-semibold text-base mb-1">Escalation policy</h2>
              <p className="text-sm text-muted">
                A non-compliance event escalates to this Alerts page automatically if a supervisor has not
                acknowledged it within <span className="font-medium text-ink">10 minutes</span> of detection.
              </p>
              <a href="/admin/alerts" className="inline-block mt-4 text-sm font-medium text-accent hover:underline">
                Review escalated alerts &rarr;
              </a>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default AdminDashboard;
