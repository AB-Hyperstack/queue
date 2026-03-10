'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { AdminOverviewStats, AdminUsageMetrics } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import StatBlock from '@/components/queue/StatBlock';
import Card from '@/components/ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function AdminOverviewPage() {
  const t = useTranslations('AdminOverview');
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [usage, setUsage] = useState<AdminUsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: statsData }, { data: usageData }] = await Promise.all([
        supabase.rpc('admin_get_overview_stats'),
        supabase.rpc('admin_get_usage_metrics', { p_days: 30 }),
      ]);

      if (statsData) setStats(statsData as unknown as AdminOverviewStats);
      if (usageData) setUsage(usageData as unknown as AdminUsageMetrics);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('title')} subtitle={t('subtitle')} />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBlock
            label={t('totalOrgs')}
            value={stats?.total_orgs ?? 0}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-18v18m4.5-18v18m4.5-18v18m4.5-18v18" />
              </svg>
            }
          />
          <StatBlock
            label={t('totalTickets')}
            value={stats?.total_tickets ?? 0}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            }
          />
          <StatBlock
            label={t('activeSubscriptions')}
            value={stats?.active_subscriptions ?? 0}
            color="green"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label={t('mrr')}
            value={`$${Number(stats?.mrr ?? 0).toFixed(0)}`}
            color="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Subscription breakdown cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('trialing')}</p>
              <p className="text-2xl font-bold text-amber-600">{stats?.trialing_orgs ?? 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('paying')}</p>
              <p className="text-2xl font-bold text-green-600">{stats?.paying_subscriptions ?? 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('expired')}</p>
              <p className="text-2xl font-bold text-red-600">{stats?.expired_orgs ?? 0}</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Ticket Volume */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('dailyTicketVolume')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage?.daily_tickets ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="joins" fill="#3b82f6" radius={[2, 2, 0, 0]} name={t('joins')} />
                  <Bar dataKey="served" fill="#10b981" radius={[2, 2, 0, 0]} name={t('served')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Platform Performance */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('platformPerformance')}</h3>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('totalServed')}</p>
                  <p className="text-2xl font-bold text-gray-900">{usage?.total_served_period ?? 0}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2.5">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('avgWaitTime')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage?.avg_wait_seconds ? Math.round(usage.avg_wait_seconds / 60) : 0} min
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('avgServiceTime')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage?.avg_service_seconds ? Math.round(usage.avg_service_seconds / 60) : 0} min
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Busiest Orgs */}
        {usage?.busiest_orgs && usage.busiest_orgs.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('topOrgs')}</h3>
            <div className="space-y-3">
              {usage.busiest_orgs.map((org, i) => {
                const maxCount = usage.busiest_orgs[0]?.ticket_count || 1;
                return (
                  <div key={org.org_id} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{org.org_name}</span>
                        <span className="text-xs text-gray-500">{org.ticket_count} {t('tickets')}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${(org.ticket_count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
