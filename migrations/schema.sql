-- =========================
-- PROFILES
-- =========================

create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamptz default now()
);


-- =========================
-- THREADS
-- =========================

create table threads (
    id uuid primary key default gen_random_uuid(),
    subject text not null,
    last_message_at timestamptz default now(),
    created_at timestamptz default now()
);


-- =========================
-- MESSAGES
-- =========================

create table messages (
    id uuid primary key default gen_random_uuid(),
    thread_id uuid not null
        references threads(id)
        on delete cascade,
    sender_id uuid not null
        references profiles(id)
        on delete cascade,
    body_html text not null,
    snippet text, -- Added for fast previews without HTML tags
    status text not null default 'sent'
        check (status in ('draft', 'sending', 'sent', 'failed')),
    created_at timestamptz default now()
);


-- =========================
-- MESSAGE RECIPIENTS
-- =========================

create table message_recipients (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null
        references messages(id)
        on delete cascade,
    -- Store the raw email address to support external/unregistered recipients
    recipient_email text not null,
    -- Optional: Link it to a profile only if they are an active user in the system
    recipient_user_id uuid null
        references profiles(id)
        on delete set null,
    recipient_type text not null
        check (recipient_type in ('to', 'cc', 'bcc'))
);


-- =========================
-- MAILBOX ENTRIES
-- =========================

create table mailbox_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null
        references profiles(id)
        on delete cascade,
    message_id uuid not null
        references messages(id)
        on delete cascade,
    folder text not null
        check (
            folder in (
                'inbox',
                'sent',
                'draft',
                'trash'
            )
        ),
    is_read boolean default false,
    is_starred boolean default false,
    created_at timestamptz default now()
);


-- =========================
-- PROFILE CREATION TRIGGER
-- =========================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================
-- RECOVERY EMAILS
-- =========================

create table recovery_emails (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null
        references profiles(id)
        on delete cascade,
    recovery_email text not null,
    is_verified boolean default false,
    verified_at timestamptz,
    created_at timestamptz default now(),
    unique(user_id),
    unique(recovery_email)
);


-- =========================
-- RECOVERY EMAIL OTPS
-- =========================

create table recovery_email_otps (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null
        references profiles(id)
        on delete cascade,
    otp text not null,
    expires_at timestamptz not null,
    created_at timestamptz default now()
);

