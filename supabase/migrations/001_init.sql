create table if not exists phien_tai_khoan (
    id uuid primary key default gen_random_uuid(),
    email_tam text not null,
    ma_otp text,
    mat_khau_vmos text,
    chuoi_dau_ra text,
    trang_thai text default 'cho_otp',
    tao_luc timestamptz default now(),
    cap_nhat_luc timestamptz default now()
);

create index if not exists idx_phien_trang_thai on phien_tai_khoan(trang_thai);

create table if not exists nhat_ky (
    id bigserial primary key,
    phien_id uuid references phien_tai_khoan(id) on delete cascade,
    hanh_dong text not null,
    chi_tiet jsonb,
    tao_luc timestamptz default now()
);

create table if not exists tai_khoan_hoan_tat (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    mat_khau text not null,
    chuoi text generated always as (email || '|' || mat_khau) stored,
    tao_luc timestamptz default now()
);

alter table phien_tai_khoan enable row level security;
alter table nhat_ky enable row level security;
alter table tai_khoan_hoan_tat enable row level security;

create policy "service_all_phien" on phien_tai_khoan
    for all using (auth.role() = 'service_role');
create policy "service_all_log" on nhat_ky
    for all using (auth.role() = 'service_role');
create policy "service_all_tk" on tai_khoan_hoan_tat
    for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table phien_tai_khoan;
