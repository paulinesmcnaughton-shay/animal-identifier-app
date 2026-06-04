-- ============================================================
-- WildKind — Dev/Admin Test Data Cleanup
-- ============================================================
-- Soft-deletes selected test sightings for a specific user.
-- Safe: only touches rows where user_id matches.
-- Does NOT affect anonymous rows (user_id IS NULL).
-- Does NOT hard-delete storage images.
-- Run via: Supabase SQL Editor, psql, or MCP execute_sql.
-- ============================================================

-- ── 1. SET YOUR USER ID ─────────────────────────────────────
-- Replace with the user_id you want to clean up.
DO $$
DECLARE
  target_user uuid := '1ea9e06d-5116-4bee-90cf-7e3977d4ee08';

  -- ── 2. SPECIES TO CLEAN ───────────────────────────────────
  -- Add species_name or species_id values to match.
  -- Matching is case-insensitive on species_name,
  -- and exact on species_id.
  target_species_names text[] := ARRAY[
    'Bengal',
    'Mixed Forest Trees',
    'old test trees',
    'old test animals'
  ];

  target_species_ids text[] := ARRAY[
    -- 'some-slug-id'  -- add species_id slugs here if needed
  ];

BEGIN

  -- ── 3. SOFT DELETE: user_sightings ────────────────────────
  UPDATE user_sightings
  SET
    is_deleted = true,
    deleted_at = NOW()
  WHERE
    user_id = target_user
    AND is_deleted = false
    AND (
      lower(trim(species_name)) = ANY (
        SELECT lower(trim(s)) FROM unnest(target_species_names) s
      )
      OR species_id = ANY (target_species_ids)
    );

  RAISE NOTICE 'user_sightings soft-deleted: %', FOUND;

  -- ── 4. SOFT DELETE: community_sightings ───────────────────
  -- Only touches rows owned by the target user (user_id IS NOT NULL).
  -- Anonymous/demo rows (user_id IS NULL) are never touched.
  UPDATE community_sightings
  SET
    is_deleted = true,
    deleted_at = NOW()
  WHERE
    user_id = target_user
    AND is_deleted = false
    AND (
      lower(trim(species_name)) = ANY (
        SELECT lower(trim(s)) FROM unnest(target_species_names) s
      )
      OR species_id = ANY (target_species_ids)
    );

  RAISE NOTICE 'community_sightings soft-deleted: %', FOUND;

END $$;

-- ── 5. VERIFY ─────────────────────────────────────────────────
-- Run this after to confirm what was soft-deleted.
SELECT
  'user_sightings' AS source,
  id,
  species_name,
  species_id,
  is_deleted,
  deleted_at
FROM user_sightings
WHERE
  user_id = '1ea9e06d-5116-4bee-90cf-7e3977d4ee08'
  AND is_deleted = true
  AND deleted_at >= NOW() - INTERVAL '5 minutes'

UNION ALL

SELECT
  'community_sightings' AS source,
  id,
  species_name,
  species_id,
  is_deleted,
  deleted_at
FROM community_sightings
WHERE
  user_id = '1ea9e06d-5116-4bee-90cf-7e3977d4ee08'
  AND is_deleted = true
  AND deleted_at >= NOW() - INTERVAL '5 minutes'

ORDER BY source, deleted_at DESC;
