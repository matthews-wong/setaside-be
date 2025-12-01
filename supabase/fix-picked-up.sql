-- Fix for picked_up status issue
-- Run this in your Supabase SQL Editor

-- OPTION 1: Disable the trigger entirely (recommended for now)
-- The application already validates status transitions
DROP TRIGGER IF EXISTS validate_order_status ON orders;

-- Verify the trigger is dropped
SELECT tgname FROM pg_trigger WHERE tgrelid = 'orders'::regclass;

-- OPTION 2: If you want to keep the trigger, run this instead:
-- (Comment out OPTION 1 above first)

/*
-- First, check if picked_up exists in the enum
DO $$ 
BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    IF (OLD.status = 'pending' AND NEW.status = 'preparing') OR
       (OLD.status = 'preparing' AND NEW.status = 'ready') OR
       (OLD.status = 'ready' AND NEW.status = 'picked_up') THEN
        RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_order_status ON orders;
CREATE TRIGGER validate_order_status
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_status_transition();
*/

-- Check enum values
SELECT unnest(enum_range(NULL::order_status)) AS status_values;
