'use client';

import { useState } from 'react';
import type { Queue } from '@/lib/types/database';
import QueueCard from './QueueCard';

interface QueueSelectorProps {
  queues: Queue[];
  waitingCounts: Record<string, number>;
  onSelect: (queue: Queue) => void;
}

export default function QueueSelector({ queues, waitingCounts, onSelect }: QueueSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Select a queue</h2>
      <div className="grid gap-3">
        {queues.map((queue) => (
          <QueueCard
            key={queue.id}
            queue={queue}
            waitingCount={waitingCounts[queue.id] || 0}
            selected={selectedId === queue.id}
            onSelect={() => {
              setSelectedId(queue.id);
              onSelect(queue);
            }}
          />
        ))}
      </div>
    </div>
  );
}
