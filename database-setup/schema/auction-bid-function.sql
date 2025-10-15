-- Atomic bid placement function
-- Re-create if missing: handles concurrency via row-level locks and single winning bid invariant.
-- Error codes follow pattern CODE::message so API can map them.

-- Ensure prior overloaded versions are removed to avoid 42725 ambiguity errors.
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT (p.oid)::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'place_bid_atomic'
  ) LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', r.sig);
  END LOOP;
END $$;

-- Canonical signature (order chosen to match earlier cached schema expectations):
-- (p_auction_id, p_bid_amount, p_team_id, p_user_id)
CREATE OR REPLACE FUNCTION public.place_bid_atomic(
  p_auction_id uuid,
  p_bid_amount integer,
  p_team_id uuid,
  p_user_id uuid
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction        auctions%ROWTYPE;
  v_team           auction_teams%ROWTYPE;
  v_current_player_id uuid;
  v_current_bid    integer;
  v_min_increment  integer;
  v_min_bid        integer;
  v_next_allowed   integer;
  v_bid_row        auction_bids%ROWTYPE;
BEGIN
  -- Lock auction to ensure consistent status & config read
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AUCTION_NOT_FOUND::Auction not found';
  END IF;
  IF v_auction.status <> 'live' THEN
    RAISE EXCEPTION 'AUCTION_NOT_LIVE::Auction is not live';
  END IF;

  -- Lock team row for purse validations
  SELECT * INTO v_team FROM auction_teams WHERE id = p_team_id AND auction_id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TEAM_NOT_FOUND::Team not found in this auction';
  END IF;

  -- Current player (single)
  SELECT player_id INTO v_current_player_id FROM auction_players
    WHERE auction_id = p_auction_id AND current_player = true
    LIMIT 1;
  IF v_current_player_id IS NULL THEN
    RAISE EXCEPTION 'NO_CURRENT_PLAYER::No current player set';
  END IF;

  -- Current winning bid (lock pattern by selecting for share of bid rows)
  SELECT bid_amount INTO v_current_bid FROM auction_bids
    WHERE auction_id = p_auction_id
      AND player_id = v_current_player_id
      AND is_winning_bid = true
      AND is_undone = false
    ORDER BY created_at DESC
    LIMIT 1;

  v_min_increment := COALESCE(v_auction.min_increment, 10);
  v_min_bid := COALESCE(v_auction.min_bid_amount, 10);

  IF v_current_bid IS NULL THEN
    v_next_allowed := v_min_bid; -- starting bid
  ELSE
    v_next_allowed := v_current_bid + v_min_increment;
  END IF;

  IF p_bid_amount < v_next_allowed THEN
    RAISE EXCEPTION 'BID_OUTDATED::A newer bid (%). Minimum now %', v_current_bid, v_next_allowed;
  END IF;

  -- Simple purse check (reserve logic can be expanded to mirror client)
  IF v_team.remaining_purse < p_bid_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS::Insufficient purse for this bid';
  END IF;

  -- Demote previous winning bid
  UPDATE auction_bids
     SET is_winning_bid = false
   WHERE auction_id = p_auction_id
     AND player_id = v_current_player_id
     AND is_winning_bid = true
     AND is_undone = false;

  -- Insert new bid
  INSERT INTO auction_bids(
    id, auction_id, player_id, team_id, bid_amount, is_winning_bid, is_undone, created_at
  ) VALUES (
    gen_random_uuid(), p_auction_id, v_current_player_id, p_team_id, p_bid_amount, true, false, now()
  ) RETURNING * INTO v_bid_row;

  RETURN json_build_object('bid', row_to_json(v_bid_row), 'current_bid', p_bid_amount);

EXCEPTION WHEN others THEN
  -- Pass through structured codes we intentionally raised
  IF SQLERRM LIKE '%::%' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'UNKNOWN::%','Bid failed';
END;
$$;

COMMENT ON FUNCTION public.place_bid_atomic(uuid, integer, uuid, uuid) IS 'Atomic bid placement with concurrency and validation checks; returns JSON {bid, current_bid}';

-- Optional: grant execute (service role usually has it, but explicit grants clarify)
GRANT EXECUTE ON FUNCTION public.place_bid_atomic(uuid, integer, uuid, uuid) TO authenticated, anon, service_role;
