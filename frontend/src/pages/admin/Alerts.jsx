import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import api from '../../api/axios';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await api.get('/violations/alerts');
    setAlerts(res.data.alerts);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 40000); // poll so newly-escalated events appear without a manual refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Alerts" subtitle="Non-compliance events unacknowledged by supervisors for over 10 minutes">
      <div className="mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-danger beacon' : 'bg-ok'}`}></span>
        <p className="text-sm text-muted">{alerts.length} escalated alert(s)</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="font-display font-semibold text-ink">No escalated alerts</p>
          <p className="text-sm text-muted mt-1">Every violation has been acknowledged within the 10 minute window.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((a) => (
            <div key={a._id} className="bg-white border border-danger/30 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-display font-semibold text-ink">{a.worker?.name}</p>
                  <p className="text-xs font-mono text-muted">{a.worker?.workerId} &middot; {a.worker?.jobProfile}</p>
                </div>
                <Badge type={a.severity}>{a.severity}</Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-muted">PPE:</span> {a.ppeType}</p>
                <p><span className="text-muted">Department:</span> {a.department}</p>
                <p><span className="text-muted">Detected:</span> {new Date(a.detectedAt).toLocaleString()}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge type="escalated">Escalated</Badge>
                <span className="text-xs font-mono text-danger font-medium">
                  {a.minutesPending} min unacknowledged
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default AdminAlerts;
