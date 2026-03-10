'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Ticket } from '@/lib/types/database';
import { formatDistanceToNow } from 'date-fns';

interface TicketRowProps {
  ticket: Ticket;
  onCall?: () => Promise<{ error: unknown } | void>;
  onComplete?: () => Promise<{ error: unknown } | void>;
  onNoShow?: () => Promise<{ error: unknown } | void>;
  onSnooze?: () => Promise<{ error: unknown } | void>;
}

export default function TicketRow({ ticket, onCall, onComplete, onNoShow, onSnooze }: TicketRowProps) {
  const t = useTranslations('Dashboard');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const waitTime = formatDistanceToNow(new Date(ticket.joined_at), { addSuffix: false });

  const handleAction = async (action: string, fn?: () => Promise<{ error: unknown } | void>) => {
    if (!fn || actionLoading) return;
    setActionLoading(action);
    setError('');
    try {
      const result = await fn();
      if (result && 'error' in result && result.error) {
        setError(t('actionFailed', { action }));
      }
    } catch {
      setError(t('actionFailed', { action }));
    }
    setActionLoading(null);
  };

  const isDisabled = actionLoading !== null;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 sm:p-4 transition-colors hover:bg-gray-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gray-100 font-mono font-bold text-gray-700 text-xs sm:text-sm shrink-0">
            {ticket.display_code}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {ticket.customer_name || 'Guest'}
            </p>
            <p className="text-xs text-gray-500">{t('waitingTime', { time: waitTime })}</p>
          </div>
          <Badge status={ticket.status} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {ticket.status === 'waiting' && (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                loading={actionLoading === 'Call'}
                disabled={isDisabled && actionLoading !== 'Call'}
                onClick={() => handleAction('Call', onCall)}
              >
                {t('callButton')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={actionLoading === 'Snooze'}
                disabled={isDisabled && actionLoading !== 'Snooze'}
                onClick={() => handleAction('Snooze', onSnooze)}
              >
                {t('snoozeButton')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={actionLoading === 'No Show'}
                disabled={isDisabled && actionLoading !== 'No Show'}
                onClick={() => handleAction('No Show', onNoShow)}
              >
                {t('noShowButton')}
              </Button>
            </div>
          )}

          {ticket.status === 'serving' && (
            <Button
              size="sm"
              variant="primary"
              loading={actionLoading === 'Complete'}
              disabled={isDisabled && actionLoading !== 'Complete'}
              onClick={() => handleAction('Complete', onComplete)}
            >
              {t('completeButton')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 text-right">{error}</p>
      )}
    </div>
  );
}
