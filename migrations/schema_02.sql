-- ==========================================
-- SCHEMA MIGRATION 02 - ONBOARDING DETAILS
-- ==========================================

-- Alter public.profiles to add new fields for onboarding
alter table public.profiles 
    add column position text,
    add column dob date,
    add column signature text,
    add column onboarded boolean default false;
