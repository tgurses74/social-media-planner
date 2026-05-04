-- Add meta_ads_plan JSONB column to projects table
-- Run in Supabase Studio → SQL Editor
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_ads_plan JSONB DEFAULT NULL;
