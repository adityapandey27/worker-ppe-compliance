import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "supervisor",
  site: "Main Site",
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get("/users");
    setUsers(res.data.users);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/users", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u) => {
    await api.patch(`/users/${u.id}/status`, { isActive: !u.isActive });
    load();
  };

  return (
    <Layout title="Users" subtitle="Create and manage supervisor accounts">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted">{users.length} user(s)</p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90"
        >
          {showForm ? "Cancel" : "+ New Supervisor"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Full name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Temporary password
            </label>
            <input
              required
              type="text"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Site / area
            </label>
            <input
              value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-danger md:col-span-2">{error}</p>
          )}
          <div className="md:col-span-2">
            <button
              disabled={submitting}
              className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Site</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-4 text-muted" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium">{u.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      {u.email}
                    </td>
                    <td className="px-5 py-3 capitalize">{u.role}</td>
                    <td className="px-5 py-3">{u.site}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? "bg-ok/10 text-ok" : "bg-slate-100 text-slate-500"}`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;
