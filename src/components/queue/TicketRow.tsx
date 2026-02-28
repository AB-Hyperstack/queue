'use client';

import { useState } from 'react';
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
        setError(`${action} failed`);
        setActionLoading(null);
      }
      // On success, don't clear loading — the row will unmount/re-render via realtime
    } catch {
      setError(`${action} failed`);
      setActionLoading(null);
    }
  };

  const isDisabled = actionLoading !== null;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 font-mono font-bold text-gray-700 text-sm">
            {ticket.display_code}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {ticket.customer_name || 'Guest'}
            </p>
            <p className="text-xs text-gray-500">Waiting {waitTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge status={ticket.status} />

          {ticket.status === 'waiting' && (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                loading={actionLoading === 'Call'}
                disabled={isDisabled && actionLoading !== 'Call'}
                onClick={() => handleAction('Call', onCall)}
              >
                Call
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={actionLoading === 'Snooze'}
                disabled={isDisabled && actionLoading !== 'Snooze'}
                onClick={() => handleAction('Snooze', onSnooze)}
              >
                Snooze
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={actionLoading === 'No Show'}
                disabled={isDisabled && actionLoading !== 'No Show'}
                onClick={() => handleAction('No Show', onNoShow)}
              >
                No Show
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
              Complete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 text-right">{error} — please try again</p>
      )}
    </div>
  );
}
