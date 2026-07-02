-- Long-term photo pre-warm: a gentle, self-sustaining cron trickle instead of
-- bulk bursts (which throttle Wikimedia and produce false negatives — see
-- project memory). Fires every 5 min, warms 15 species (most-observed first,
-- since prewarm-species-photos orders by dex_number = occurrence_count desc),
-- 60s timeout. Self-limiting: returns instantly once nothing is unchecked.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'prewarm-species-photos-trickle',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://wiysesftlprovkpouvqu.supabase.co/functions/v1/prewarm-species-photos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_QLe0faP1klanHt3V_HFy1w_K8EDJmUD'
    ),
    body := jsonb_build_object('limit', 15),
    timeout_milliseconds := 60000
  );
  $$
);
