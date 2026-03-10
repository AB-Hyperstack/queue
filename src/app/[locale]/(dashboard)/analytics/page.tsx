'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Organization, StaffMember, AnalyticsLog, Feedback } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import StatBlock from '@/components/queue/StatBlock';
import StarRating from '@/components/ui/StarRating';
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
  const tFeedback = useTranslations('Feedback');
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totalServed, setTotalServed] = useState(0);
  const [avgWaitTime, setAvgWaitTime] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<{ stars: string; count: number }[]>([]);
  const [recentComments, setRecentComments] = useState<{ rating: number; comment: string; created_at: string }[]>([]);

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

      // Fetch feedback for org
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('org_id', orgData.id)
        .order('created_at', { ascending: false });

      if (feedbackData) {
        processFeedback(feedbackData as Feedback[]);
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

  function processFeedback(feedback: Feedback[]) {
    if (feedback.length === 0) return;

    // Average rating
    const avg = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    setAvgRating(Math.round(avg * 10) / 10);
    setTotalFeedback(feedback.length);

    // Rating distribution (5 → 1)
    const dist = [5, 4, 3, 2, 1].map((stars) => ({
      stars: `${stars}`,
      count: feedback.filter((f) => f.rating === stars).length,
    }));
    setRatingDistribution(dist);

    // Recent comments (last 10 with non-null comments)
    const comments = feedback
      .filter((f) => f.comment)
      .slice(0, 10)
      .map((f) => ({
        rating: f.rating,
        comment: f.comment!,
        created_at: f.created_at,
      }));
    setRecentComments(comments);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('title')} subtitle={`${org?.name} — ${t('last7Days')}`} />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Bar dataKey="joins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Throughput */}
          <Card className="md:col-span-2">
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

        {/* Customer Feedback Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tFeedback('totalFeedback')}</h2>

          {totalFeedback === 0 ? (
            <Card className="text-center">
              <p className="text-gray-500">{tFeedback('noFeedbackYet')}</p>
            </Card>
          ) : (
            <>
              {/* Feedback Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatBlock
                  label={tFeedback('avgRating')}
                  value={avgRating}
                  color="amber"
                  icon={
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  }
                />
                <StatBlock
                  label={tFeedback('totalFeedback')}
                  value={totalFeedback}
                  color="blue"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rating Distribution Chart */}
                <Card>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{tFeedback('ratingDistribution')}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                        <YAxis
                          dataKey="stars"
                          type="category"
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                          width={30}
                        />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Recent Comments */}
                <Card>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{tFeedback('recentComments')}</h3>
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {recentComments.length === 0 ? (
                      <p className="text-sm text-gray-400">{tFeedback('noFeedbackYet')}</p>
                    ) : (
                      recentComments.map((item, i) => (
                        <div key={i} className="border-b border-gray-50 pb-3 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StarRating value={item.rating} readonly size="sm" />
                            <span className="text-xs text-gray-400">
                              {format(new Date(item.created_at), 'MMM dd')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{item.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
