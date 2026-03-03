import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
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
          <Link
            href="/auth/login"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-teal-600 mb-3">By CareLabs Sweden</p>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Smart queue management for modern businesses
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Reduce wait times, eliminate physical lines, and improve customer satisfaction.
            QueueFlow by CareLabs Sweden gives your customers a seamless digital queuing experience.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/auth/login"
              className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/join/demo"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Try demo
            </Link>
            <Link
              href="/kiosk/demo"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Kiosk mode
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-12">Everything you need</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 mb-4">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Customer Input</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Customers join your queue by scanning a QR code or entering their details on a kiosk. No app download required.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 mb-4">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Queue Groups</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Create multiple queue lanes for different services. Route customers to the right team automatically.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-4">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Kiosk Mode</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Set up a tablet at your entrance for walk-in customers to take a number with a single tap.
              </p>
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
            QueueFlow &mdash; A digital queue management service by CareLabs Sweden
          </p>
        </div>
      </footer>
    </div>
  );
}
