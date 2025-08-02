-- Fix DCA Plans that should be marked as COMPLETED
-- This script identifies and updates plans that have 0 remaining executions
-- but are still marked as ACTIVE

-- First, let's see what plans need to be fixed
SELECT 
    id,
    user_id,
    plan_type,
    status,
    remaining_executions,
    total_executions,
    created_at,
    completed_at
FROM active_plans 
WHERE remaining_executions = 0 AND status = 'ACTIVE'
ORDER BY created_at DESC;

-- Update plans with 0 remaining executions to COMPLETED status
UPDATE active_plans 
SET 
    status = 'COMPLETED',
    completed_at = UTC_TIMESTAMP()
WHERE 
    remaining_executions = 0 
    AND status = 'ACTIVE';

-- Show the results after update
SELECT 
    id,
    user_id,
    plan_type,
    status,
    remaining_executions,
    total_executions,
    created_at,
    completed_at
FROM active_plans 
WHERE status = 'COMPLETED'
ORDER BY completed_at DESC;
