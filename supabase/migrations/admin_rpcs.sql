-- ============================================
-- ADMIN BACK-OFFICE RPCs
-- All SECURITY DEFINER to bypass RLS
-- Access controlled by middleware (ADMIN_EMAIL)
-- ============================================

-- ============================================
-- 1. Overview stats
-- ============================================
CREATE OR REPLACE FUNCTION admin_get_overview_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_orgs', (SELECT count(*) FROM organizations),
    'total_tickets', (SELECT count(*) FROM tickets),
    'active_subscriptions', (
      SELECT count(*) FROM subscriptions WHERE status IN ('active', 'trialing')
    ),
    'paying_subscriptions', (
      SELECT count(*) FROM subscriptions WHERE status = 'active'
    ),
    'mrr', (
      SELECT coalesce(sum(
        CASE
          WHEN plan = 'monthly' THEN 49
          WHEN plan = 'yearly' THEN round(469.0 / 12, 2)
          ELSE 0
        END
      ), 0)
      FROM subscriptions WHERE status = 'active'
    ),
    'total_queues', (SELECT count(*) FROM queues),
    'trialing_orgs', (
      SELECT count(*) FROM subscriptions WHERE status = 'trialing'
    ),
    'expired_orgs', (
      SELECT count(*) FROM subscriptions WHERE status = 'expired'
    )
  );
END;
$$;

-- ============================================
-- 2. Organization list with details
-- ============================================
CREATE OR REPLACE FUNCTION admin_get_org_list(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'total', (SELECT count(*) FROM organizations),
    'orgs', coalesce((
      SELECT jsonb_agg(row_data ORDER BY created DESC)
      FROM (
        SELECT jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'created_at', o.created_at,
          'subscription_status', coalesce(s.status, 'none'),
          'plan', s.plan,
          'trial_end', s.trial_end,
          'queue_count', (SELECT count(*) FROM queues WHERE org_id = o.id),
          'ticket_count', (SELECT count(*) FROM tickets WHERE org_id = o.id),
          'staff_count', (SELECT count(*) FROM staff_members WHERE org_id = o.id),
          'tickets_today', (
            SELECT count(*) FROM tickets
            WHERE org_id = o.id AND created_at >= current_date
          )
        ) AS row_data,
        o.created_at AS created
        FROM organizations o
        LEFT JOIN subscriptions s ON s.org_id = o.id
        ORDER BY o.created_at DESC
        LIMIT p_limit OFFSET p_offset
      ) sub
    ), '[]'::jsonb)
  );
END;
$$;

-- ============================================
-- 3. Revenue metrics
-- ============================================
CREATE OR REPLACE FUNCTION admin_get_revenue_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'monthly_subscribers', (
      SELECT count(*) FROM subscriptions WHERE status = 'active' AND plan = 'monthly'
    ),
    'yearly_subscribers', (
      SELECT count(*) FROM subscriptions WHERE status = 'active' AND plan = 'yearly'
    ),
    'mrr', (
      SELECT coalesce(sum(
        CASE
          WHEN plan = 'monthly' THEN 49
          WHEN plan = 'yearly' THEN round(469.0 / 12, 2)
          ELSE 0
        END
      ), 0)
      FROM subscriptions WHERE status = 'active'
    ),
    'arr', (
      SELECT coalesce(sum(
        CASE
          WHEN plan = 'monthly' THEN 49 * 12
          WHEN plan = 'yearly' THEN 469
          ELSE 0
        END
      ), 0)
      FROM subscriptions WHERE status = 'active'
    ),
    'status_breakdown', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'status', status, 'count', cnt
      )), '[]'::jsonb)
      FROM (
        SELECT status, count(*) AS cnt FROM subscriptions GROUP BY status
      ) sub
    ),
    'monthly_growth', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'month', to_char(month, 'YYYY-MM'),
        'new_orgs', new_orgs,
        'new_paying', new_paying
      ) ORDER BY month), '[]'::jsonb)
      FROM (
        SELECT
          date_trunc('month', o.created_at) AS month,
          count(DISTINCT o.id) AS new_orgs,
          count(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS new_paying
        FROM organizations o
        LEFT JOIN subscriptions s ON s.org_id = o.id
        WHERE o.created_at >= date_trunc('month', now()) - interval '11 months'
        GROUP BY date_trunc('month', o.created_at)
      ) sub
    )
  );
END;
$$;

-- ============================================
-- 4. Usage metrics (last N days)
-- ============================================
CREATE OR REPLACE FUNCTION admin_get_usage_metrics(
  p_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'daily_tickets', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'date', to_char(d, 'YYYY-MM-DD'),
        'joins', coalesce(joins, 0),
        'served', coalesce(served, 0),
        'no_shows', coalesce(no_shows, 0)
      ) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT generate_series(
          current_date - (p_days - 1),
          current_date,
          '1 day'::interval
        )::date AS d
      ) days
      LEFT JOIN (
        SELECT
          created_at::date AS day,
          count(*) FILTER (WHERE event_type = 'join') AS joins,
          count(*) FILTER (WHERE event_type = 'serve') AS served,
          count(*) FILTER (WHERE event_type = 'no_show') AS no_shows
        FROM analytics_logs
        WHERE created_at >= current_date - p_days
        GROUP BY created_at::date
      ) al ON al.day = days.d
    ),
    'avg_wait_seconds', (
      SELECT coalesce(round(avg(wait_duration_sec)), 0)
      FROM analytics_logs
      WHERE event_type = 'call' AND wait_duration_sec IS NOT NULL
      AND created_at >= current_date - p_days
    ),
    'avg_service_seconds', (
      SELECT coalesce(round(avg(service_duration_sec)), 0)
      FROM analytics_logs
      WHERE event_type = 'serve' AND service_duration_sec IS NOT NULL
      AND created_at >= current_date - p_days
    ),
    'total_served_period', (
      SELECT count(*) FROM analytics_logs
      WHERE event_type = 'serve' AND created_at >= current_date - p_days
    ),
    'busiest_orgs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'org_id', org_id, 'org_name', org_name, 'ticket_count', cnt
      ) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT al.org_id, o.name AS org_name, count(*) AS cnt
        FROM analytics_logs al
        JOIN organizations o ON o.id = al.org_id
        WHERE al.event_type = 'join' AND al.created_at >= current_date - p_days
        GROUP BY al.org_id, o.name
        ORDER BY cnt DESC LIMIT 10
      ) sub
    )
  );
END;
$$;

-- ============================================
-- 5. Delete organization (cascading)
-- ============================================
CREATE OR REPLACE FUNCTION admin_delete_organization(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name TEXT;
BEGIN
  SELECT name INTO org_name FROM organizations WHERE id = p_org_id;

  IF org_name IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- CASCADE on FK handles: staff_members, queues, tickets, analytics_logs, subscriptions
  DELETE FROM organizations WHERE id = p_org_id;

  RETURN jsonb_build_object('deleted', true, 'org_name', org_name);
END;
$$;

-- ============================================
-- 6. Update organization
-- ============================================
CREATE OR REPLACE FUNCTION admin_update_organization(
  p_org_id UUID,
  p_name TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_org RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  IF p_slug IS NOT NULL AND EXISTS (
    SELECT 1 FROM organizations WHERE slug = p_slug AND id != p_org_id
  ) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;

  UPDATE organizations SET
    name = coalesce(p_name, name),
    slug = coalesce(p_slug, slug)
  WHERE id = p_org_id
  RETURNING * INTO updated_org;

  RETURN jsonb_build_object(
    'id', updated_org.id,
    'name', updated_org.name,
    'slug', updated_org.slug
  );
END;
$$;
