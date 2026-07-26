import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const COLORS = ['#3B6FE0', '#F5A623', '#E5484D', '#21A366', '#8B5CF6', '#0B1220'];

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6">
    <h2 className="font-display font-semibold text-base">{title}</h2>
    {subtitle && <p className="text-xs text-muted mb-4">{subtitle}</p>}
    <div className="h-64 mt-2">{children}</div>
  </div>
);

const AdminInsights = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/insights').then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <Layout title="Data Insights" subtitle="Operational insights across the workforce">
        <p className="text-sm text-muted">Loading insights...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Data Insights" subtitle="Charts and trends derived from live violation data">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Violations by PPE type" subtitle="Which equipment is most frequently missing">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byPpeType}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F0" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B6FE0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="7-day violation trend" subtitle="Daily count of detected non-compliance events">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#E5484D" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Violations by department" subtitle="Where non-compliance concentrates">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.byDepartment} dataKey="count" nameKey="department" outerRadius={90} label>
                {data.byDepartment.map((entry, index) => (
                  <Cell key={entry.department} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 repeat non-compliance workers" subtitle="Workers with the most flagged violations">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topViolators} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E9F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#F5A623" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </Layout>
  );
};

export default AdminInsights;
