import type { TicketStatus } from '@/lib/types/database';

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  waiting: { label: 'Waiting', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  serving: { label: 'Serving', className: 'bg-teal-50 text-teal-700 ring-teal-600/20' },
  served: { label: 'Served', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  no_show: { label: 'No Show', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' },
};

interface BadgeProps {
  status: TicketStatus;
}

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
}
