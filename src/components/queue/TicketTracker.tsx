'use client';

import type { Ticket, Queue } from '@/lib/types/database';

interface TicketTrackerProps {
  ticket: Ticket;
  queue: Queue;
  aheadCount: number;
}

export default function TicketTracker({ ticket, queue, aheadCount }: TicketTrackerProps) {
  const estimatedWait = aheadCount * queue.avg_service_time_min;
  const isBeingServed = ticket.status === 'serving';
  const isCompleted = ticket.status === 'served';

  // Progress: 100% when serving, calculate based on position otherwise
  const maxPosition = aheadCount + 1;
  const progress = isBeingServed || isCompleted
    ? 100
    : Math.max(5, ((maxPosition - aheadCount) / maxPosition) * 100);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Circular Progress */}
      <div className="relative h-48 w-48 mb-6">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="12"
          />
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke={isBeingServed ? '#10b981' : '#0d9488'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 85}`}
            strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">
            {ticket.display_code}
          </span>
          <span className="text-sm text-gray-500 mt-1">Your number</span>
        </div>
      </div>

      {/* Status */}
      {isBeingServed && (
        <div className="rounded-full bg-green-100 px-4 py-2 mb-4">
          <p className="text-sm font-semibold text-green-700">
            It&apos;s your turn!
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="rounded-full bg-gray-100 px-4 py-2 mb-4">
          <p className="text-sm font-semibold text-gray-600">
            Completed
          </p>
        </div>
      )}

      {ticket.status === 'waiting' && (
        <>
          <p className="text-5xl font-bold text-gray-900 mb-2">{aheadCount}</p>
          <p className="text-gray-500 mb-1">
            {aheadCount === 0 ? "You're next!" : `${aheadCount === 1 ? 'person' : 'people'} ahead of you`}
          </p>
          <p className="text-sm text-gray-400">
            Estimated wait: ~{estimatedWait} min
          </p>
        </>
      )}

      {/* Queue Info */}
      <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: queue.color }}
        />
        {queue.name}
      </div>
    </div>
  );
}
