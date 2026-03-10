-- ============================================
-- FEEDBACK (customer ratings per ticket)
-- ============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  queue_id UUID REFERENCES queues(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feedback_org ON feedback(org_id, created_at);
CREATE INDEX idx_feedback_ticket ON feedback(ticket_id);

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Customers can submit feedback (public insert, matching existing patterns)
CREATE POLICY "Public submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Public can read feedback by ticket_id (needed for reload detection on track page)
CREATE POLICY "Public read feedback" ON feedback
  FOR SELECT USING (true);

-- Staff can read their org's feedback
CREATE POLICY "Staff read org feedback" ON feedback
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );
