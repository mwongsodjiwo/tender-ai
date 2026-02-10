-- Migration: Replace time_entry_activity_type enum with project phases
-- Old values: specifying, evaluation, nvi, correspondence, market_research, meeting, other
-- New values: preparing, exploring, specifying, tendering, contracting

-- PostgreSQL does not support ALTER TYPE ... REMOVE VALUE, so we recreate the enum.

BEGIN;

-- Step 1: Add a temporary text column
ALTER TABLE time_entries ADD COLUMN activity_type_new TEXT;

-- Step 2: Map existing data to new phase values
UPDATE time_entries SET activity_type_new = CASE activity_type::text
    WHEN 'specifying'       THEN 'specifying'
    WHEN 'evaluation'       THEN 'tendering'
    WHEN 'nvi'              THEN 'tendering'
    WHEN 'correspondence'   THEN 'tendering'
    WHEN 'market_research'  THEN 'exploring'
    WHEN 'meeting'          THEN 'preparing'
    WHEN 'other'            THEN 'preparing'
    ELSE 'preparing'
END;

-- Step 3: Drop the old column (which uses the old enum)
ALTER TABLE time_entries DROP COLUMN activity_type;

-- Step 4: Drop the old enum type
DROP TYPE time_entry_activity_type;

-- Step 5: Create the new enum with project phases only
CREATE TYPE time_entry_activity_type AS ENUM (
    'preparing',
    'exploring',
    'specifying',
    'tendering',
    'contracting'
);

-- Step 6: Add the column back with the new enum type
ALTER TABLE time_entries ADD COLUMN activity_type time_entry_activity_type NOT NULL DEFAULT 'preparing';

-- Step 7: Copy mapped values into the new enum column
UPDATE time_entries SET activity_type = activity_type_new::time_entry_activity_type;

-- Step 8: Drop the temporary text column
ALTER TABLE time_entries DROP COLUMN activity_type_new;

COMMIT;
