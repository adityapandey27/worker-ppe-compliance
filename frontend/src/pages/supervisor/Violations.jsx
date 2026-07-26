import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import api from '../../api/axios';

const PPE_TYPES = ['Helmet', 'Safety Vest', 'Safety Gloves', 'Safety Boots', 'Safety Goggles', 'Face Mask'];

const SupervisorViolations = () => {
  const [violations, setViolations] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSimForm, setShowSimForm] = useState(false);
  const [simForm, setSimForm] = useState({ workerId: '', ppeType: '', backdateMinutes: '' });
  const [ackingId, setAckingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/violations', { params: statusFilter ? { status: statusFilter } : {} });
    setViolations(res.data.violations);
    setLoading(false);
  };

  useEffect(() => {
    api.get('/workers').then((res) => setWorkers(res.data.workers));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const acknowledge = async (id) => {
    setAckingId(id);
    try {
      await api.patch(`/violations/${id}/acknowledge`);
      load();
    } finally {
      setAckingId(null);
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    const payload = {};
    if (simForm.workerId) payload.workerId = simForm.workerId;
    if (simForm.ppeType) payload.ppeType = simForm.ppeType;
    if (simForm.backdateMinutes) payload.backdateMinutes = Number(simForm.backdateMinutes);
    await api.post('/violations/simulate', payload);
    setShowSimForm(false);
    setSimForm({ workerId: '', ppeType: '', backdateMinutes: '' });
    load();
  };

  return (
    <Layout >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {['', 'pending', 'acknowledged'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                statusFilter === s ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === '' ? 'All' : s === 'pending' ? 'Pending' : 'Acknowledged'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSimForm((s) => !s)}
          className="bg-danger text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-danger/90"
        >
          {showSimForm ? 'Cancel' : '⚠ Simulate Violation'}
        </button>
      </div>

      {showSimForm && (
        <form onSubmit={handleSimulate} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Worker (optional)</label>
            <select value={simForm.workerId} onChange={(e) => setSimForm({ ...simForm, workerId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">Random</option>
              {workers.map((w) => (
                <option key={w._id} value={w.workerId}>{w.name} ({w.workerId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">PPE type (optional)</label>
            <select value={simForm.ppeType} onChange={(e) => setSimForm({ ...simForm, ppeType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">Random</option>
              {PPE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Detected (min ago)</label>
            <input
              type="number"
              min="0"
              placeholder="0 = now"
              value={simForm.backdateMinutes}
              onChange={(e) => setSimForm({ ...simForm, backdateMinutes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <p className="text-[11px] text-muted mt-1">Use 11+ to instantly demo escalation to Admin &gt; Alerts.</p>
          </div>
          <button className="bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-lg h-fit">Create event</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl h-[70vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Worker</th>
              <th className="text-left px-5 py-3">PPE Missing</th>
              <th className="text-left px-5 py-3">Department</th>
              <th className="text-left px-5 py-3">Severity</th>
              <th className="text-left px-5 py-3">Detected</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td className="px-5 py-4 text-muted" colSpan={7}>Loading...</td></tr>
            ) : violations.length === 0 ? (
              <tr><td className="px-5 py-6 text-muted text-center" colSpan={7}>No violations found.</td></tr>
            ) : (
              violations.map((v) => (
                <tr key={v._id} className={v.isEscalated ? 'bg-danger/5' : ''}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{v.worker?.name}</p>
                    <p className="text-xs font-mono text-muted">{v.worker?.workerId}</p>
                  </td>
                  <td className="px-5 py-3">{v.ppeType}</td>
                  <td className="px-5 py-3">{v.department}</td>
                  <td className="px-5 py-3"><Badge type={v.severity}>{v.severity}</Badge></td>
                  <td className="px-5 py-3 text-xs">
                    {new Date(v.detectedAt).toLocaleString()}
                    {v.status === 'pending' && (
                      <p className={`font-mono mt-0.5 ${v.isEscalated ? 'text-danger' : 'text-muted'}`}>
                        {v.minutesPending} min ago {v.isEscalated ? '(escalated)' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge type={v.isEscalated ? 'escalated' : v.status}>
                      {v.isEscalated ? 'Escalated' : v.status === 'acknowledged' ? 'Acknowledged' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {v.status === 'pending' ? (
                      <button
                        onClick={() => acknowledge(v._id)}
                        disabled={ackingId === v._id}
                        className="text-xs font-medium bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90 disabled:opacity-60"
                      >
                        {ackingId === v._id ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted">by {v.acknowledgedBy?.name}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default SupervisorViolations;
