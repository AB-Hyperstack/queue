-- Onboarding RPC Functions
-- These use SECURITY DEFINER to bypass RLS for the initial org/staff creation
-- (the chicken-and-egg problem: RLS requires staff_members row, but we need to create it)

-- ============================================
-- Check if an org slug is available
-- ============================================
CREATE OR REPLACE FUNCTION check_org_slug_available(slug_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM organizations WHERE slug = slug_to_check);
$$;

-- ============================================
-- Create organization with owner (atomic)
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
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already have an org
  IF EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Validate slug uniqueness
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) THEN
    RAISE EXCEPTION 'Organization slug already taken';
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Create owner staff member
  INSERT INTO staff_members (org_id, user_id, role, name)
  VALUES (new_org_id, auth.uid(), 'owner', owner_name)
  RETURNING id INTO new_staff_id;

  -- Optionally create first queue
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
