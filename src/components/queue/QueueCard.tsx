'use client';

import type { Queue } from '@/lib/types/database';

interface QueueCardProps {
  queue: Queue;
  waitingCount: number;
  onSelect?: () => void;
  selected?: boolean;
}

export default function QueueCard({ queue, waitingCount, onSelect, selected }: QueueCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-150 hover:shadow-md ${
        selected
          ? 'border-teal-500 bg-teal-50/50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: queue.color }}
        />
        <h3 className="font-semibold text-gray-900">{queue.name}</h3>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {waitingCount} {waitingCount === 1 ? 'person' : 'people'} waiting
        </span>
        <span className="text-sm text-gray-400">
          ~{waitingCount * queue.avg_service_time_min} min
        </span>
      </div>
    </button>
  );
}
