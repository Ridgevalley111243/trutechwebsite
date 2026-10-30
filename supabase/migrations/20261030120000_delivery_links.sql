-- Download links for client work: one per file format, usually a public
-- Google Drive link, so finished designs don't have to be uploaded here.
-- Clients only get them through the client-portal function, and only when
-- the link allows downloads.
create table public.site_delivery_links (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.site_deliveries (id) on delete cascade,
  format text not null check (length(format) between 1 and 24),
  label text not null default '' check (length(label) <= 120),
  url text not null check (url ~ '^https://' and length(url) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.site_delivery_links (delivery_id);

alter table public.site_delivery_links enable row level security;
create policy "admin manages delivery links" on public.site_delivery_links
  for all to authenticated using ((select private.is_site_admin())) with check ((select private.is_site_admin()));
grant select, insert, update, delete on public.site_delivery_links to authenticated;
