import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import api from '../../api/axios';

const SupervisorDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  const load = async () => {
    const res = await api.get('/dashboard/supervisor');
    setMetrics(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerDemo = async () => {
    setSimulating(true);
    setSimMessage('');
    try {
      const res = await api.post('/violations/simulate', {});
      setSimMessage(`Simulated: ${res.data.violation.worker.name} flagged for missing ${res.data.violation.ppeType}.`);
      load();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Layout title="Supervisor Dashboard" subtitle="Your compliance monitoring overview">
      {loading ? (
        <p className="text-sm text-muted">Loading metrics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Violations Today" value={metrics.violationsToday} tone="amber" />
            <StatCard label="Pending (Site-wide)" value={metrics.pendingViolations} tone="amber" pulse />
            <StatCard label="Acknowledged By Me" value={metrics.acknowledgedByMe} tone="ok" />
            <StatCard label="Avg. Response Time" value={`${metrics.avgResponseMinutes} min`} tone="accent" />
          </div>

          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display font-semibold text-base mb-1">Simulate IoT non-compliance event</h2>
            <p className="text-sm text-muted mb-4">
              For demo purposes: manually trigger a random PPE violation, as if reported live by a worker's IoT device.
              It will appear immediately on the Violations page.
            </p>
            <button
              onClick={triggerDemo}
              disabled={simulating}
              className="bg-danger text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-danger/90 disabled:opacity-60"
            >
              {simulating ? 'Simulating...' : '⚠ Trigger Random Violation'}
            </button>
            {simMessage && <p className="text-sm text-ok mt-3">{simMessage}</p>}
          </div>
        </>
      )}
    </Layout>
  );
};

export default SupervisorDashboard;
