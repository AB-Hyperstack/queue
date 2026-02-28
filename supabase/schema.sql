-- QueueFlow Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- ORGANIZATIONS (multi-tenant root)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STAFF MEMBERS (business users linked to orgs)
-- ============================================
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner','admin','staff')) DEFAULT 'staff' NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ============================================
-- QUEUES (multiple lanes per organization)
-- ============================================
CREATE TABLE queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#0D9488',
  is_active BOOLEAN DEFAULT true,
  avg_service_time_min INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, slug)
);

-- ============================================
-- TICKETS (individual queue entries)
-- ============================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES queues(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  ticket_number INTEGER NOT NULL,
  display_code TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT CHECK (status IN ('waiting','serving','served','no_show','cancelled')) DEFAULT 'waiting' NOT NULL,
  position INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  push_subscription JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ANALYTICS LOGS (event tracking)
-- ============================================
CREATE TABLE analytics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  queue_id UUID REFERENCES queues(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ticket_id UUID,
  wait_duration_sec INTEGER,
  service_duration_sec INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tickets_queue_status ON tickets(queue_id, status);
CREATE INDEX idx_tickets_org_status ON tickets(org_id, status);
CREATE INDEX idx_tickets_position ON tickets(queue_id, position) WHERE status = 'waiting';
CREATE INDEX idx_analytics_org_date ON analytics_logs(org_id, created_at);
CREATE INDEX idx_staff_user ON staff_members(user_id);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: staff can read their own org
CREATE POLICY "Staff see own org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

-- Staff members: can see colleagues in same org
CREATE POLICY "Staff see org members" ON staff_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

-- Queues: staff can manage, public can view active
CREATE POLICY "Staff manage own org queues" ON queues
  FOR ALL USING (
    org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Public view active queues" ON queues
  FOR SELECT USING (is_active = true);

-- Tickets: staff can manage, public can read and insert
CREATE POLICY "Staff manage org tickets" ON tickets
  FOR ALL USING (
    org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Public read tickets" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Public join queue" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update own ticket" ON tickets
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Analytics: staff only
CREATE POLICY "Staff read org analytics" ON analytics_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Insert analytics" ON analytics_logs
  FOR INSERT WITH CHECK (true);
