-- Deletes Umami's raw analytics data older than :keep_months months
-- (docker-compose.yml → umami-retention, once a day). The privacy policy
-- (§ "Reichweitenmessung mit Umami") promises this limit — keep the two in
-- step. Umami has no retention setting of its own when self-hosted.
--
-- Umami's tables carry no foreign keys (Prisma relationMode = "prisma"), so
-- the order below is only for tidiness: children first, sessions last.
\set ON_ERROR_STOP on

-- On the very first start Umami may not have created its tables yet.
SELECT to_regclass('public.website_event') IS NOT NULL AS umami_ready \gset
\if :umami_ready
BEGIN;
DELETE FROM event_data
  WHERE created_at < now() - make_interval(months => :keep_months);
DELETE FROM website_event
  WHERE created_at < now() - make_interval(months => :keep_months);
DELETE FROM session_data
  WHERE created_at < now() - make_interval(months => :keep_months);
DELETE FROM revenue
  WHERE created_at < now() - make_interval(months => :keep_months);
DELETE FROM session s
  WHERE s.created_at < now() - make_interval(months => :keep_months)
    AND NOT EXISTS (SELECT 1 FROM website_event e WHERE e.session_id = s.session_id);
COMMIT;
\else
\echo 'umami tables not created yet — nothing to prune'
\endif
