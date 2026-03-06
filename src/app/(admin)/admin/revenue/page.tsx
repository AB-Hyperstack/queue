'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AdminRevenueMetrics } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import StatBlock from '@/components/queue/StatBlock';
import Card from '@/components/ui/Card';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  trialing: '#f59e0b',
  active: '#10b981',
  past_due: '#f97316',
  canceled: '#9ca3af',
  expired: '#ef4444',
};

export default function AdminRevenuePage() {
  const [metrics, setMetrics] = useState<AdminRevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.rpc('admin_get_revenue_metrics');
      if (data) setMetrics(data as unknown as AdminRevenueMetrics);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const pieData = metrics?.status_breakdown?.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#9ca3af',
  })) ?? [];

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Revenue" subtitle="Subscription metrics" />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBlock
            label="Monthly Revenue (MRR)"
            value={`$${Number(metrics?.mrr ?? 0).toFixed(0)}`}
            color="green"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label="Annual Revenue (ARR)"
            value={`$${Number(metrics?.arr ?? 0).toFixed(0)}`}
            color="teal"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />
          <StatBlock
            label="Monthly Plans"
            value={metrics?.monthly_subscribers ?? 0}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
          />
          <StatBlock
            label="Yearly Plans"
            value={metrics?.yearly_subscribers ?? 0}
            color="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription Status Breakdown */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription Breakdown</h3>
            <div className="h-64">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                  No subscription data yet
                </div>
              )}
            </div>
          </Card>

          {/* Monthly Growth */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Growth (12 months)</h3>
            <div className="h-64">
              {metrics?.monthly_growth && metrics.monthly_growth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthly_growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10 }}
                      stroke="#9ca3af"
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Bar dataKey="new_orgs" fill="#9ca3af" radius={[2, 2, 0, 0]} name="New Orgs" />
                    <Bar dataKey="new_paying" fill="#10b981" radius={[2, 2, 0, 0]} name="New Paying" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                  No growth data yet
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Revenue Projection */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Snapshot</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Revenue</p>
              <p className="mt-1 text-xl font-bold text-gray-900">${Number(metrics?.mrr ?? 0).toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Projected Annual</p>
              <p className="mt-1 text-xl font-bold text-gray-900">${Number(metrics?.arr ?? 0).toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Revenue per Org</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                ${((metrics?.monthly_subscribers ?? 0) + (metrics?.yearly_subscribers ?? 0)) > 0
                  ? (Number(metrics?.mrr ?? 0) / ((metrics?.monthly_subscribers ?? 0) + (metrics?.yearly_subscribers ?? 0))).toFixed(0)
                  : '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Paying</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {(metrics?.monthly_subscribers ?? 0) + (metrics?.yearly_subscribers ?? 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
