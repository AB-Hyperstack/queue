'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Organization, StaffMember, AnalyticsLog } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import StatBlock from '@/components/queue/StatBlock';
import Card from '@/components/ui/Card';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface HourlyData {
  hour: string;
  joins: number;
}

interface DailyData {
  date: string;
  avgWait: number;
  served: number;
}

export default function AnalyticsPage() {
  const t = useTranslations('Analytics');
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totalServed, setTotalServed] = useState(0);
  const [avgWaitTime, setAvgWaitTime] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staff } = await supabase
        .from('staff_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .single();

      if (!staff) { setLoading(false); return; }

      const orgData = (staff as StaffMember & { organizations: Organization }).organizations;
      setOrg(orgData);

      // Fetch analytics for last 7 days
      const weekAgo = subDays(new Date(), 7);
      const { data: logs } = await supabase
        .from('analytics_logs')
        .select('*')
        .eq('org_id', orgData.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at');

      if (logs) {
        processAnalytics(logs as AnalyticsLog[]);
      }

      setLoading(false);
    }
    load();
  }, []);

  function processAnalytics(logs: AnalyticsLog[]) {
    // Hourly join distribution (today)
    const today = new Date();
    const todayLogs = logs.filter(
      (l) => l.event_type === 'join' &&
        new Date(l.created_at) >= startOfDay(today) &&
        new Date(l.created_at) <= endOfDay(today)
    );

    const hourCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      joins: 0,
    }));

    todayLogs.forEach((l) => {
      const hour = new Date(l.created_at).getHours();
      hourCounts[hour].joins++;
    });
    setHourlyData(hourCounts.filter((_, i) => i >= 7 && i <= 22));

    // Daily stats
    const dailyMap = new Map<string, { waits: number[]; served: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(today, i), 'MMM dd');
      dailyMap.set(d, { waits: [], served: 0 });
    }

    logs.forEach((l) => {
      const d = format(new Date(l.created_at), 'MMM dd');
      const entry = dailyMap.get(d);
      if (!entry) return;

      if (l.event_type === 'serve') {
        entry.served++;
      }
      if (l.event_type === 'call' && l.wait_duration_sec) {
        entry.waits.push(l.wait_duration_sec);
      }
    });

    const daily: DailyData[] = [];
    dailyMap.forEach((val, key) => {
      daily.push({
        date: key,
        avgWait: val.waits.length
          ? Math.round(val.waits.reduce((a, b) => a + b, 0) / val.waits.length / 60)
          : 0,
        served: val.served,
      });
    });
    setDailyData(daily);

    // Summary stats
    const serveEvents = logs.filter((l) => l.event_type === 'serve');
    const callEvents = logs.filter((l) => l.event_type === 'call' && l.wait_duration_sec);
    const serviceEvents = logs.filter((l) => l.event_type === 'serve' && l.service_duration_sec);

    setTotalServed(serveEvents.length);
    setAvgWaitTime(
      callEvents.length
        ? Math.round(
            callEvents.reduce((sum, l) => sum + (l.wait_duration_sec ?? 0), 0) /
              callEvents.length / 60
          )
        : 0
    );
    setAvgServiceTime(
      serviceEvents.length
        ? Math.round(
            serviceEvents.reduce((sum, l) => sum + (l.service_duration_sec ?? 0), 0) /
              serviceEvents.length / 60
          )
        : 0
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('title')} subtitle={`${org?.name} — ${t('last7Days')}`} />

      <div className="flex-1 overflow-auto p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatBlock
            label={t('totalServed')}
            value={totalServed}
            color="green"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label={t('avgWaitTime')}
            value={`${avgWaitTime} min`}
            color="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label={t('avgServiceTime')}
            value={`${avgServiceTime} min`}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Peak Times */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('peakTimesToday')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="joins" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Average Wait Time Trend */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('avgWaitTimeMin')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgWait"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ fill: '#0d9488' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Throughput */}
          <Card className="col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('dailyThroughput')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="served" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
