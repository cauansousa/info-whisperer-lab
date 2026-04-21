-- Email queue table
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  html_body text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  retry_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.email_queue enable row level security;

-- Only service_role can touch this table
create policy "service_role_all" on public.email_queue
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
