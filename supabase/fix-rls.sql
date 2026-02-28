-- Fix RLS infinite recursion and add public read policies
-- Run this in the Supabase SQL Editor

-- Step 1: Create a SECURITY DEFINER function to avoid recursion
-- This function bypasses RLS when looking up org_ids for the current user
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT org_id FROM staff_members WHERE user_id = auth.uid()
$$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "Staff see own org" ON organizations;
DROP POLICY IF EXISTS "Staff see org members" ON staff_members;
DROP POLICY IF EXISTS "Staff manage own org queues" ON queues;
DROP POLICY IF EXISTS "Public view active queues" ON queues;
DROP POLICY IF EXISTS "Staff manage org tickets" ON tickets;
DROP POLICY IF EXISTS "Public read tickets" ON tickets;
DROP POLICY IF EXISTS "Public join queue" ON tickets;
DROP POLICY IF EXISTS "Public update own ticket" ON tickets;
DROP POLICY IF EXISTS "Staff read org analytics" ON analytics_logs;
DROP POLICY IF EXISTS "Insert analytics" ON analytics_logs;

-- Step 3: Recreate policies using the helper function

-- Organizations: public can read (needed for /join/[slug]), staff see own
CREATE POLICY "Public read orgs" ON organizations
  FOR SELECT USING (true);

-- Staff members: use direct user_id check (no recursion)
CREATE POLICY "Staff see own record" ON staff_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff see org members" ON staff_members
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

-- Queues: public can view active, staff manage own org
CREATE POLICY "Public view active queues" ON queues
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff manage own org queues" ON queues
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

-- Tickets: public can read/insert/update, staff manage own org
CREATE POLICY "Staff manage org tickets" ON tickets
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Public read tickets" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Public join queue" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update own ticket" ON tickets
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Analytics: staff read, public insert
CREATE POLICY "Staff read org analytics" ON analytics_logs
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Insert analytics" ON analytics_logs
  FOR INSERT WITH CHECK (true);
