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

export interface Feedback {
  id: string;
  ticket_id: string;
  org_id: string;
  queue_id: string | null;
  rating: number;
  comment: string | null;
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

// Billing
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type PlanType = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  org_id: string;
  status: SubscriptionStatus;
  plan: PlanType | null;
  trial_start: string;
  trial_end: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatusResponse {
  status: SubscriptionStatus;
  plan: PlanType | null;
  trial_start: string;
  trial_end: string;
  trial_days_remaining: number;
  current_period_start: string | null;
  current_period_end: string | null;
}

// Admin dashboard types
export interface AdminOverviewStats {
  total_orgs: number;
  total_tickets: number;
  active_subscriptions: number;
  paying_subscriptions: number;
  mrr: number;
  total_queues: number;
  trialing_orgs: number;
  expired_orgs: number;
}

export interface AdminOrgListItem {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_status: string;
  plan: string | null;
  trial_end: string | null;
  queue_count: number;
  ticket_count: number;
  staff_count: number;
  tickets_today: number;
}

export interface AdminOrgListResponse {
  total: number;
  orgs: AdminOrgListItem[];
}

export interface AdminRevenueMetrics {
  monthly_subscribers: number;
  yearly_subscribers: number;
  mrr: number;
  arr: number;
  status_breakdown: { status: string; count: number }[];
  monthly_growth: { month: string; new_orgs: number; new_paying: number }[];
}

export interface AdminUsageMetrics {
  daily_tickets: { date: string; joins: number; served: number; no_shows: number }[];
  avg_wait_seconds: number;
  avg_service_seconds: number;
  total_served_period: number;
  busiest_orgs: { org_id: string; org_name: string; ticket_count: number }[];
}
