-- QueueFlow Seed Data
-- Run this after schema.sql to populate demo data

-- Create a demo organization
INSERT INTO organizations (id, name, slug, settings) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Clinic', 'demo', '{"timezone": "UTC"}');

-- Create demo queues
INSERT INTO queues (id, org_id, name, slug, color, is_active, avg_service_time_min) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'General', 'general', '#0D9488', true, 5),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Online Pick Up', 'online-pickup', '#F59E0B', true, 3),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Support', 'support', '#3B82F6', true, 10);

-- Create demo tickets (waiting)
INSERT INTO tickets (queue_id, org_id, ticket_number, display_code, customer_name, status, position, joined_at) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 1, 'G-001', 'Alice Johnson', 'waiting', 1, now() - interval '25 minutes'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 2, 'G-002', 'Bob Smith', 'waiting', 2, now() - interval '18 minutes'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 3, 'G-003', NULL, 'waiting', 3, now() - interval '12 minutes'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 4, 'G-004', 'Diana Prince', 'waiting', 4, now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 1, 'O-001', 'Eve Wilson', 'waiting', 1, now() - interval '8 minutes'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 2, 'O-002', 'Frank Lee', 'waiting', 2, now() - interval '3 minutes'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 1, 'S-001', 'Grace Kim', 'waiting', 1, now() - interval '15 minutes');

-- Create a serving ticket
INSERT INTO tickets (queue_id, org_id, ticket_number, display_code, customer_name, status, position, joined_at, called_at) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 0, 'G-000', 'Test User', 'serving', 0, now() - interval '30 minutes', now() - interval '2 minutes');

-- Sample analytics logs (last 7 days)
INSERT INTO analytics_logs (org_id, queue_id, event_type, wait_duration_sec, service_duration_sec, created_at) VALUES
  -- Day 1
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '7 days' + interval '9 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'call', 300, NULL, now() - interval '7 days' + interval '9 hours 5 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'serve', NULL, 420, now() - interval '7 days' + interval '9 hours 12 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '7 days' + interval '10 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'call', 240, NULL, now() - interval '7 days' + interval '10 hours 4 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'serve', NULL, 360, now() - interval '7 days' + interval '10 hours 10 minutes'),
  -- Day 3
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '5 days' + interval '11 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'call', 480, NULL, now() - interval '5 days' + interval '11 hours 8 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'serve', NULL, 300, now() - interval '5 days' + interval '11 hours 13 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'join', NULL, NULL, now() - interval '5 days' + interval '14 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'call', 180, NULL, now() - interval '5 days' + interval '14 hours 3 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'serve', NULL, 240, now() - interval '5 days' + interval '14 hours 7 minutes'),
  -- Day 5
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '3 days' + interval '9 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'call', 360, NULL, now() - interval '3 days' + interval '9 hours 6 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'serve', NULL, 480, now() - interval '3 days' + interval '9 hours 14 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '3 days' + interval '13 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'call', 420, NULL, now() - interval '3 days' + interval '13 hours 7 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'serve', NULL, 300, now() - interval '3 days' + interval '13 hours 12 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'no_show', NULL, NULL, now() - interval '3 days' + interval '15 hours'),
  -- Today
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'join', NULL, NULL, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'call', 300, NULL, now() - interval '2 hours 55 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'serve', NULL, 360, now() - interval '2 hours 49 minutes'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'join', NULL, NULL, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'join', NULL, NULL, now() - interval '30 minutes');

-- NOTE: To link a staff member, after creating a Supabase Auth user, run:
-- INSERT INTO staff_members (org_id, user_id, role, name) VALUES
--   ('00000000-0000-0000-0000-000000000001', '<YOUR_AUTH_USER_ID>', 'owner', 'Your Name');
