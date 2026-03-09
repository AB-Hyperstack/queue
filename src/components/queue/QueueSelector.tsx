'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Queue } from '@/lib/types/database';
import QueueCard from './QueueCard';

interface QueueSelectorProps {
  queues: Queue[];
  waitingCounts: Record<string, number>;
  onSelect: (queue: Queue) => void;
}

export default function QueueSelector({ queues, waitingCounts, onSelect }: QueueSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const t = useTranslations('Join');

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{t('selectAQueue')}</h2>
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
