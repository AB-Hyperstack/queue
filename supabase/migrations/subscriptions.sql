-- ============================================
-- SUBSCRIPTIONS (billing status per org)
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('trialing','active','past_due','canceled','expired'))
    DEFAULT 'trialing' NOT NULL,
  plan TEXT CHECK (plan IN ('monthly','yearly')) DEFAULT NULL,
  trial_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read own subscription" ON subscriptions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

-- ============================================
-- Get subscription status (with lazy expiration)
-- ============================================
CREATE OR REPLACE FUNCTION get_subscription_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  sub RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.* INTO sub
  FROM subscriptions s
  INNER JOIN staff_members sm ON sm.org_id = s.org_id
  WHERE sm.user_id = auth.uid()
  LIMIT 1;

  IF sub IS NULL THEN
    RETURN NULL;
  END IF;

  -- Auto-expire trial if past trial_end
  IF sub.status = 'trialing' AND now() > sub.trial_end THEN
    UPDATE subscriptions SET status = 'expired', updated_at = now()
    WHERE id = sub.id;
    sub.status := 'expired';
  END IF;

  RETURN jsonb_build_object(
    'status', sub.status,
    'plan', sub.plan,
    'trial_start', sub.trial_start,
    'trial_end', sub.trial_end,
    'trial_days_remaining', GREATEST(0, EXTRACT(DAY FROM sub.trial_end - now())::int),
    'current_period_start', sub.current_period_start,
    'current_period_end', sub.current_period_end
  );
END;
$$;

-- ============================================
-- Update onboarding RPC to include subscription
-- ============================================
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  owner_name TEXT,
  first_queue_name TEXT DEFAULT NULL,
  first_queue_color TEXT DEFAULT '#0D9488'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  new_staff_id UUID;
  new_queue_id UUID;
  queue_slug TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  IF EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) THEN
    RAISE EXCEPTION 'Organization slug already taken';
  END IF;

  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO staff_members (org_id, user_id, role, name)
  VALUES (new_org_id, auth.uid(), 'owner', owner_name)
  RETURNING id INTO new_staff_id;

  -- Create trial subscription
  INSERT INTO subscriptions (org_id, status, trial_start, trial_end)
  VALUES (new_org_id, 'trialing', now(), now() + interval '14 days');

  IF first_queue_name IS NOT NULL AND first_queue_name != '' THEN
    queue_slug := lower(regexp_replace(first_queue_name, '[^a-z0-9]+', '-', 'gi'));
    queue_slug := trim(both '-' from queue_slug);

    INSERT INTO queues (org_id, name, slug, color)
    VALUES (new_org_id, first_queue_name, queue_slug, first_queue_color)
    RETURNING id INTO new_queue_id;
  END IF;

  RETURN jsonb_build_object(
    'org_id', new_org_id,
    'staff_id', new_staff_id,
    'queue_id', new_queue_id
  );
END;
$$;

-- ============================================
-- Backfill existing orgs
-- ============================================
INSERT INTO subscriptions (org_id, status, trial_start, trial_end)
SELECT id, 'trialing', created_at, created_at + interval '14 days'
FROM organizations
WHERE id NOT IN (SELECT org_id FROM subscriptions)
ON CONFLICT (org_id) DO NOTHING;
