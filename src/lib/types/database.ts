export type TicketStatus = 'waiting' | 'serving' | 'served' | 'no_show' | 'cancelled';
export type StaffRole = 'owner' | 'admin' | 'staff';
export type AnalyticsEventType = 'join' | 'call' | 'serve' | 'no_show' | 'cancel';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface StaffMember {
  id: string;
  org_id: string;
  user_id: string;
  role: StaffRole;
  name: string;
  created_at: string;
}

export interface Queue {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  avg_service_time_min: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  queue_id: string;
  org_id: string;
  ticket_number: number;
  display_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: TicketStatus;
  position: number | null;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  push_subscription: PushSubscriptionJSON | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsLog {
  id: string;
  org_id: string;
  queue_id: string | null;
  event_type: AnalyticsEventType;
  ticket_id: string | null;
  wait_duration_sec: number | null;
  service_duration_sec: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Ticket with queue info for display
export interface TicketWithQueue extends Ticket {
  queue?: Queue;
}
