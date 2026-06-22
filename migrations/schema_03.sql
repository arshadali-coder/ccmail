-- ==========================================
-- SCHEMA MIGRATION 03 - EXTERNAL SENDERS SUPPORT
-- ==========================================

-- 1. Alter sender_id in public.messages to be nullable
alter table public.messages 
    alter column sender_id drop not null;

-- 2. Add sender_email to public.messages
alter table public.messages 
    add column sender_email text;

-- 3. Populate sender_email for existing messages from public.profiles
update public.messages m
set sender_email = p.email
from public.profiles p
where m.sender_id = p.id;

-- 4. Set sender_email as not null after populating it
alter table public.messages 
    alter column sender_email set not null;

-- 5. Drop old foreign key constraint and recreate it as ON DELETE SET NULL
alter table public.messages 
    drop constraint if exists messages_sender_id_fkey;

alter table public.messages
    add constraint messages_sender_id_fkey
    foreign key (sender_id)
    references public.profiles(id)
    on delete set null;
