'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { useQueue } from '@/lib/hooks/useQueue';
import { useRealtimeTickets } from '@/lib/hooks/useRealtimeTickets';
import { usePrinter } from '@/lib/hooks/usePrinter';
import type { Queue, Organization } from '@/lib/types/database';

export default function KioskPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const t = useTranslations('Kiosk');

  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { joinQueue } = useQueue();
  const printer = usePrinter();

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (orgData) {
        setOrg(orgData);
        const { data: queueData } = await supabase
          .from('queues')
          .select('*')
          .eq('org_id', orgData.id)
          .eq('is_active', true)
          .order('name');

        if (queueData) setQueues(queueData);
      }
      setLoading(false);
    }
    load();
  }, [orgSlug]);

  // Get realtime waiting counts
  const { tickets: allTickets } = useRealtimeTickets({
    orgId: org?.id,
    statusFilter: ['waiting', 'serving'],
  });

  const getWaitingCount = useCallback(
    (queueId: string) => allTickets.filter((t) => t.queue_id === queueId && t.status === 'waiting').length,
    [allTickets]
  );

  const getNowServing = useCallback(
    (queueId: string) => {
      const serving = allTickets.find((t) => t.queue_id === queueId && t.status === 'serving');
      return serving?.display_code || '—';
    },
    [allTickets]
  );

  const handleTakeNumber = async (queue: Queue) => {
    if (!org) return;

    const { data } = await joinQueue(queue.id, org.id);
    if (data) {
      setTicketCode(data.display_code);
      setTicketId(data.id);
      setShowTicket(true);

      // Fire-and-forget: print ticket if printer is connected
      if (printer.status === 'connected') {
        const trackUrl = `${appUrl}/track/${data.id}`;
        printer.print({
          orgName: org.name,
          queueName: queue.name,
          displayCode: data.display_code,
          trackUrl,
          timestamp: new Date(),
        });
      }

      // Auto-dismiss after 12 seconds (longer to allow QR scanning)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setShowTicket(false);
        setTicketCode(null);
        setTicketId(null);
      }, 12000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 kiosk-mode">
        <div className="animate-spin h-12 w-12 rounded-full border-3 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  // Ticket confirmation overlay
  if (showTicket && ticketId) {
    const trackUrl = `${appUrl}/track/${ticketId}`;

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-blue-600 kiosk-mode">
        <div className="text-center text-white">
          <p className="text-2xl font-medium mb-4">{t('yourNumberIs')}</p>
          <p className="text-9xl font-bold tracking-wider mb-6">{ticketCode}</p>
          <p className="text-xl opacity-80 mb-10">{t('pleaseWait')}</p>

          {/* QR Code for mobile tracking */}
          <div className="inline-flex flex-col items-center bg-white rounded-2xl p-6 shadow-lg">
            <QRCodeSVG
              value={trackUrl}
              size={180}
              fgColor="#0f172a"
              bgColor="#ffffff"
              level="M"
            />
            <p className="mt-4 text-sm font-medium text-gray-700">
              {t('scanToTrack')}
            </p>
          </div>

          <div className="mt-8 animate-pulse">
            <p className="text-sm opacity-60">{t('autoClose')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 kiosk-mode no-scrollbar">
      {/* Kiosk Header */}
      <header className="flex items-center justify-between bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{org?.name}</h1>
            <p className="text-sm text-gray-500">{t('tapToTakeNumber')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Bluetooth Printer Button – only shown when Web Bluetooth is available */}
          {printer.supported && (
            <button
              onClick={printer.status === 'connected' ? printer.disconnect : printer.connect}
              disabled={printer.status === 'connecting'}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                printer.status === 'connected'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : printer.status === 'connecting'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 cursor-wait'
                  : printer.status === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {/* Printer icon */}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034V3.375" />
              </svg>
              <span>
                {printer.status === 'connected'
                  ? t('printerConnected')
                  : printer.status === 'connecting'
                  ? t('printerConnecting')
                  : printer.status === 'error'
                  ? t('printerError')
                  : t('connectPrinter')}
              </span>
              {/* Green dot indicator when connected */}
              {printer.status === 'connected' && (
                <span className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </button>
          )}
          <div className="text-right">
            <p className="text-sm text-gray-400">{t('kioskBranding')}</p>
          </div>
        </div>
      </header>

      {/* Queue Buttons */}
      <main className="flex-1 grid gap-6 p-8" style={{
        gridTemplateColumns: queues.length <= 2 ? `repeat(${queues.length}, 1fr)` : 'repeat(3, 1fr)',
      }}>
        {queues.map((queue) => {
          const waiting = getWaitingCount(queue.id);
          const serving = getNowServing(queue.id);

          return (
            <button
              key={queue.id}
              onClick={() => handleTakeNumber(queue)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white border-2 border-gray-100
                         shadow-sm hover:shadow-lg hover:border-blue-200 active:scale-[0.98]
                         transition-all duration-200 p-8 min-h-[250px]"
            >
              {/* Color dot */}
              <div
                className="h-5 w-5 rounded-full mb-4"
                style={{ backgroundColor: queue.color }}
              />

              {/* Queue name */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{queue.name}</h2>

              {/* Stats */}
              <div className="flex gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{waiting}</p>
                  <p className="text-sm text-gray-500">{t('waiting')}</p>
                </div>
                <div className="border-l border-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-blue-600">{serving}</p>
                  <p className="text-sm text-gray-500">{t('nowServing')}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 rounded-xl bg-blue-600 px-8 py-3 text-white font-semibold text-lg">
                {t('takeANumber')}
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
