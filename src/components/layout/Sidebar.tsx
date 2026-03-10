'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useSidebar } from '@/components/layout/SidebarProvider';

const navItems = [
  {
    href: '/dashboard',
    labelKey: 'queue',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    labelKey: 'analytics',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    labelKey: 'settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/billing',
    labelKey: 'billing',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const { isTrialing, isActive, isExpired, daysRemaining, showWarning } = useSubscription();
  const { isOpen, close } = useSidebar();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/carelabs-logo.svg"
            alt="CareLabs"
            width={120}
            height={20}
          />
          <span className="text-xs font-medium text-gray-400 border-l border-gray-200 pl-2">QueueFlow</span>
        </div>
        {/* Close button — mobile only */}
        <button onClick={close} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isItemActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isItemActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Subscription Status */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        {isTrialing && (
          <Link href="/billing">
            <div className={`rounded-lg p-3 text-sm ${
              showWarning
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-blue-50 border border-blue-100'
            }`}>
              <div className="flex items-center gap-2">
                <svg className={`h-4 w-4 ${showWarning ? 'text-amber-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`font-medium ${showWarning ? 'text-amber-700' : 'text-blue-700'}`}>
                  {t('trialDaysLeft', { days: daysRemaining })}
                </span>
              </div>
              <p className={`text-xs mt-1 ${showWarning ? 'text-amber-600' : 'text-blue-600'}`}>
                {showWarning ? t('upgradeToKeep') : t('upgradeAnytime')}
              </p>
            </div>
          </Link>
        )}

        {isActive && (
          <Link href="/billing">
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-sm">
              <span className="font-medium text-green-700">{t('proPlan')}</span>
              <p className="text-xs text-green-600 mt-0.5">{t('activeSubscription')}</p>
            </div>
          </Link>
        )}

        {isExpired && (
          <Link href="/billing">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
              <span className="font-medium text-red-700">{t('trialExpired')}</span>
              <p className="text-xs text-red-600 mt-0.5">{t('upgradeToContinue')}</p>
            </div>
          </Link>
        )}

        <p className="text-xs text-gray-400">{t('branding')}</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white
          transform transition-transform duration-200 ease-in-out
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
