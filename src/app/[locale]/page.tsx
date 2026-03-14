'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Home() {
  const t = useTranslations('Landing');
  const p = useTranslations('PlanFeatures');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/carelabs-logo.svg"
              alt="CareLabs"
              width={140}
              height={23}
              priority
            />
            <span className="text-xs font-medium text-gray-400 border-l border-gray-200 pl-3">QueueFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/auth/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {t('signIn')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-blue-600 mb-3">{t('byCareLabs')}</p>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            {t('heroDescription')}
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/auth/login?mode=signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {t('startFreeTrial')}
            </Link>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-16 text-center">{t('showcaseTitle')}</h2>

          {/* Customer View */}
          <div className="grid gap-12 md:grid-cols-2 items-center mb-20">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('customerViewTitle')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('customerViewDesc')}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              {/* Phone-style mockup */}
              <div className="bg-blue-600 px-6 py-4 text-white">
                <p className="text-xs font-medium opacity-80">QueueFlow</p>
                <p className="text-lg font-bold mt-1">{t('customerViewMockupQueue')}</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t('customerViewMockupPosition')}</span>
                  <span className="text-3xl font-bold text-blue-600">A-04</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-3/5 rounded-full bg-blue-500" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t('customerViewMockupWait')}
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    {t('customerViewMockupNotify')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin View */}
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              {/* Dashboard-style mockup */}
              <div className="bg-gray-900 px-6 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-400 ml-2">QueueFlow Dashboard</span>
              </div>
              <div className="p-5">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">5</p>
                    <p className="text-xs text-amber-700">{t('adminViewMockupWaiting')}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">2</p>
                    <p className="text-xs text-blue-700">{t('adminViewMockupServing')}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xl font-bold text-gray-600">4m</p>
                    <p className="text-xs text-gray-500">Avg Wait</p>
                  </div>
                </div>
                {/* Queue list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">A-01</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Erik S.</p>
                        <p className="text-xs text-blue-600">{t('adminViewMockupServing')}</p>
                      </div>
                    </div>
                    <button className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white">{t('adminViewMockupComplete')}</button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">A-02</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Anna L.</p>
                        <p className="text-xs text-gray-500">{t('adminViewMockupWaiting')} — 3 min</p>
                      </div>
                    </div>
                    <button className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white">{t('adminViewMockupCall')}</button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">A-03</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Johan K.</p>
                        <p className="text-xs text-gray-500">{t('adminViewMockupWaiting')} — 1 min</p>
                      </div>
                    </div>
                    <button className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white">{t('adminViewMockupCall')}</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('adminViewTitle')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('adminViewDesc')}</p>
            </div>
          </div>

          {/* Analytics View */}
          <div className="grid gap-12 md:grid-cols-2 items-center mt-20">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('analyticsViewTitle')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('analyticsViewDesc')}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="bg-gray-900 px-6 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-400 ml-2">QueueFlow Analytics</span>
              </div>
              <div className="p-5">
                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">127</p>
                    <p className="text-xs text-blue-700">{t('analyticsViewMockupServed')}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">4m</p>
                    <p className="text-xs text-amber-700">{t('analyticsViewMockupAvgWait')}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-xl font-bold text-green-600">8m</p>
                    <p className="text-xs text-green-700">{t('analyticsViewMockupAvgService')}</p>
                  </div>
                </div>
                {/* Chart mockup */}
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-3">{t('analyticsViewMockupDaily')}</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[35, 50, 42, 65, 58, 72, 48].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-sm bg-blue-400" style={{ height: `${h}%` }} />
                        <span className="text-[9px] text-gray-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback View */}
          <div className="grid gap-12 md:grid-cols-2 items-center mt-20">
            <div className="order-2 md:order-1 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="bg-gray-900 px-6 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-400 ml-2">QueueFlow Feedback</span>
              </div>
              <div className="p-5">
                {/* Rating overview */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-lg bg-amber-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`h-4 w-4 ${s <= 4 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <p className="text-2xl font-bold text-amber-600">4.3</p>
                    <p className="text-xs text-amber-700">{t('feedbackViewMockupAvgRating')}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 mt-3">89</p>
                    <p className="text-xs text-blue-700">{t('feedbackViewMockupTotal')}</p>
                  </div>
                </div>
                {/* Recent comments */}
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('feedbackViewMockupRecent')}</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex gap-0.5 mt-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`h-3 w-3 ${s <= 5 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">&quot;Snabb och smidig service!&quot;</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex gap-0.5 mt-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`h-3 w-3 ${s <= 4 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">&quot;Didn&apos;t have to wait long at all&quot;</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex gap-0.5 mt-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`h-3 w-3 ${s <= 3 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">&quot;Bra kösystem, enkelt att använda&quot;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('feedbackViewTitle')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('feedbackViewDesc')}</p>
            </div>
          </div>
          {/* QR Code Ticket Tracking */}
          <div className="grid gap-12 md:grid-cols-2 items-center mt-20">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('qrTrackingTitle')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('qrTrackingDesc')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Printed ticket mockup */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-medium text-gray-400 mb-2">{t('qrTrackingMockupPrintedTicket')}</p>
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-5 w-full shadow-sm">
                  <div className="text-center space-y-3">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">QueueFlow</p>
                    <div className="border-t border-dashed border-gray-200 pt-3">
                      <p className="text-xs text-gray-500">{t('qrTrackingMockupYourNumber')}</p>
                      <p className="text-4xl font-bold text-gray-900 tracking-wider mt-1">B-07</p>
                    </div>
                    <p className="text-[10px] text-gray-400">General Queue</p>
                    {/* QR code placeholder */}
                    <div className="mx-auto w-20 h-20 bg-gray-900 rounded-md p-1.5">
                      <div className="w-full h-full bg-white rounded-sm grid grid-cols-5 grid-rows-5 gap-px p-1">
                        {[1,1,1,0,1, 1,0,0,1,1, 0,1,1,0,0, 1,1,0,1,1, 1,0,1,1,0].map((v, i) => (
                          <div key={i} className={`rounded-[1px] ${v ? 'bg-gray-900' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400">{t('qrTrackingMockupScan')}</p>
                    <div className="border-t border-dashed border-gray-200 pt-2">
                      <p className="text-[8px] text-gray-300">14 Mar 2026 — 10:34</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone tracking mockup */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-medium text-gray-400 mb-2">{t('qrTrackingMockupLiveTracking')}</p>
                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden w-full">
                  <div className="bg-blue-600 px-4 py-3 text-white">
                    <p className="text-[10px] font-medium opacity-80">QueueFlow</p>
                    <p className="text-sm font-bold mt-0.5">B-07</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{t('qrTrackingMockupPosition')}</span>
                      <span className="text-2xl font-bold text-blue-600">#3</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t('qrTrackingMockupWait')}
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-blue-700">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                        {t('qrTrackingMockupNotify')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Setup - Bouncepad */}
          <div className="grid gap-12 md:grid-cols-2 items-center mt-20">
            <div className="order-2 md:order-1">
              {/* Bouncepad product photo */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-lg overflow-hidden p-6">
                <Image
                  src="/bouncepad-floorstanding.jpg"
                  alt="Bouncepad Original Floorstanding with Brother Printer Mount — tablet kiosk stand with integrated thermal printer"
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-xl"
                />
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-gray-800">{t('hardwareMockupTitle')}</p>
                  <p className="text-xs text-gray-500">{t('hardwareMockupSubtitle')}</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('hardwareTitle')}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">{t('hardwareDesc')}</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {t('hardwareFeature1')}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {t('hardwareFeature2')}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {t('hardwareFeature3')}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {t('hardwareFeature4')}
                </li>
              </ul>
              <div className="flex items-center gap-4">
                <a
                  href="https://eu.bouncepad.com/en-eu/products/floorstanding-with-brother-printer-mount"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  {t('hardwareCta')}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                </a>
                <span className="text-sm font-semibold text-gray-500">{t('hardwarePrice')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-12">{t('everythingYouNeed')}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-4">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">{t('featureCustomerInputTitle')}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {t('featureCustomerInputDesc')}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 mb-4">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">{t('featureQueueGroupsTitle')}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {t('featureQueueGroupsDesc')}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-4">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">{t('featureKioskModeTitle')}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {t('featureKioskModeDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">{t('pricingTitle')}</h2>
            <p className="mt-3 text-gray-600">{t('pricingSubtitle')}</p>
          </div>

          <div className="mx-auto max-w-3xl grid gap-6 md:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900">{t('monthly')}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">{t('monthlyPrice')}</span>
                <span className="text-gray-500">{t('monthlyPer')}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{t('monthlyDesc')}</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('unlimitedQueues')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('unlimitedStaff')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('realtimeAnalytics')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('qrAndKiosk')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('pushNotifications')}
                </li>
              </ul>
              <Link
                href="/auth/login?mode=signup"
                className="mt-8 block rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('startFreeTrial')}
              </Link>
            </div>

            {/* Yearly — highlighted */}
            <div className="rounded-xl bg-white p-8 shadow-sm border-2 border-blue-600 relative">
              <div className="absolute -top-3 right-6 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {t('save17')}
              </div>
              <h3 className="font-semibold text-gray-900">{t('yearly')}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">{t('yearlyPrice')}</span>
                <span className="text-gray-500">{t('yearlyPer')}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{t('yearlyDesc')}</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('unlimitedQueues')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('unlimitedStaff')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('realtimeAnalytics')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('qrAndKiosk')}
                </li>
                <li className="flex gap-2">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {p('pushNotifications')}
                </li>
              </ul>
              <Link
                href="/auth/login?mode=signup"
                className="mt-8 block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t('startFreeTrial')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Image
            src="/carelabs-logo.svg"
            alt="CareLabs"
            width={110}
            height={18}
            className="mx-auto mb-2 opacity-40"
          />
          <p className="text-sm text-gray-400">
            {t('footerText')}
          </p>
        </div>
      </footer>
    </div>
  );
}
