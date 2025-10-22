# PostgreSQL Function Overloading Issue Fix

## Problem
The error "Could not choose the best candidate function between: public.place_bid_atomic..." occurs when PostgreSQL has multiple functions with the same name but different parameter orders, creating ambiguity.In your case, there are two `place_bid_atomic` functions:

1. `place_bid_atomic(p_auction_id => uuid, p_team_id => uuid, p_bid_amount => integer, p_user_id => uuid)`
2. `place_bid_atomic(p_auction_id => uuid, p_bid_amount => integer, p_team_id => uuid, p_user_id => uuid)`

The difference is in parameter order: `p_team_id` vs `p_bid_amount` in positions 2 and 3.

## Solution Options

### Option 1: Clean Function Recreation (Recommended)
Run the `fix-place-bid-function.sql` script to:
1. Drop all existing `place_bid_atomic` functions
2. Recreate the single correct function with signature `(uuid, uuid, integer, uuid)`

### Option 2: Alternative Function Names
Run the `fix-place-bid-overload.sql` script to:
1. Drop existing functions  
2. Create only the function we need
3. Verify creation with a query

## Steps to Fix

1. Connect to your PostgreSQL database (Supabase SQL Editor or psql)
2. Run one of the SQL scripts:
   ```sql
   -- Copy and paste contents of fix-place-bid-function.sql
   -- OR
   -- Copy and paste contents of fix-place-bid-overload.sql
   ```
3. Test the application to ensure bidding works correctly

## Expected Function Signature
After the fix, you should have only one `place_bid_atomic` function with this signature:
```sql
place_bid_atomic(
  p_auction_id UUID,     -- Position 1
  p_team_id UUID,        -- Position 2  
  p_bid_amount INTEGER,  -- Position 3
  p_user_id UUID         -- Position 4
)
```

## Verification
After running the fix, you can verify the function exists correctly:
```sql
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname = 'place_bid_atomic';
```

This should return exactly one row showing the function with the correct parameter types.