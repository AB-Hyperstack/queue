'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Ticket } from '@/lib/types/database';
import { formatDistanceToNow } from 'date-fns';

interface TicketRowProps {
  ticket: Ticket;
  onCall?: () => void;
  onComplete?: () => void;
  onNoShow?: () => void;
  onSnooze?: () => void;
}

export default function TicketRow({ ticket, onCall, onComplete, onNoShow, onSnooze }: TicketRowProps) {
  const waitTime = formatDistanceToNow(new Date(ticket.joined_at), { addSuffix: false });

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50/50">
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
            <Button size="sm" onClick={onCall}>
              Call
            </Button>
            <Button size="sm" variant="secondary" onClick={onSnooze}>
              Snooze
            </Button>
            <Button size="sm" variant="danger" onClick={onNoShow}>
              No Show
            </Button>
          </div>
        )}

        {ticket.status === 'serving' && (
          <Button size="sm" variant="primary" onClick={onComplete}>
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}
