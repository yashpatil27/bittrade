-- Fix MySQL timezone configuration
-- Run this to standardize on UTC for all timestamp storage

-- Set global timezone to UTC
SET GLOBAL time_zone = '+00:00';
SET SESSION time_zone = '+00:00';

-- Verify the change
SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();

-- Note: You should also add this to your MySQL configuration file (my.cnf or my.ini):
-- [mysqld]
-- default-time-zone = '+00:00'
