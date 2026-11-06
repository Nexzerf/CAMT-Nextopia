-- ==========================================================
-- CAMT NEXTOPIA — พลเมือง (ตัวละครที่ผู้เล่นสร้าง) ในเมือง
-- 1 เครื่อง = 1 ตัวละคร (เล่นซ้ำ = อัปเดตตัวเดิม)
-- ==========================================================
create table if not exists nextopia.residents (
  id         uuid primary key default gen_random_uuid(),
  device_id  text not null unique,
  nickname   text not null check (char_length(nickname) between 1 and 16),
  major      text not null check (major in ('SE','MMIT','ANI','DG','DII')),
  hair       smallint not null default 0 check (hair between 0 and 7),
  hair_color smallint not null default 0 check (hair_color between 0 and 9),
  skin       smallint not null default 0 check (skin between 0 and 4),
  acc        smallint not null default 0 check (acc between 0 and 5),
  top        smallint not null default 0 check (top between 0 and 3),
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists residents_updated on nextopia.residents (updated_at desc) where not hidden;

create table if not exists nextopia.banned_words (word text primary key);

alter table nextopia.residents    enable row level security;
alter table nextopia.banned_words enable row level security;
revoke all on nextopia.residents, nextopia.banned_words from public, anon, authenticated;

-- ---------- เข้าเมือง / อัปเดตตัวละคร ----------
create or replace function public.nextopia_join(
  p_device text, p_nickname text, p_major text,
  p_hair int default 0, p_hair_color int default 0, p_skin int default 0, p_acc int default 0, p_top int default 0
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_nick text;
  v_norm text;
  v_row  nextopia.residents;
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then
    return json_build_object('error', 'invalid device');
  end if;
  v_nick := regexp_replace(trim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  if char_length(v_nick) < 1 or char_length(v_nick) > 16 then
    return json_build_object('error', 'nickname length');
  end if;
  v_norm := lower(regexp_replace(v_nick, '[\s\.\-_\*]+', '', 'g'));
  if exists (select 1 from nextopia.banned_words b where position(lower(b.word) in v_norm) > 0) then
    return json_build_object('error', 'nickname not allowed');
  end if;
  -- กันสแปม: ตัวละครใหม่ทั้งเมืองไม่เกิน 150 ตัว/นาที
  if not exists (select 1 from nextopia.residents where device_id = p_device)
     and (select count(*) from nextopia.residents where created_at > now() - interval '1 minute') >= 150 then
    return json_build_object('error', 'busy');
  end if;

  insert into nextopia.residents (device_id, nickname, major, hair, hair_color, skin, acc, top)
  values (p_device, v_nick, p_major,
          least(greatest(p_hair, 0), 7), least(greatest(p_hair_color, 0), 9),
          least(greatest(p_skin, 0), 4), least(greatest(p_acc, 0), 5), least(greatest(p_top, 0), 3))
  on conflict (device_id) do update set
    nickname = excluded.nickname, major = excluded.major, hair = excluded.hair,
    hair_color = excluded.hair_color, skin = excluded.skin, acc = excluded.acc, top = excluded.top,
    updated_at = now()
  returning * into v_row;

  return json_build_object('id', v_row.id, 'nickname', v_row.nickname, 'major', v_row.major);
end $$;

-- ---------- รายชื่อพลเมืองในเมือง (ล่าสุด) ----------
create or replace function public.nextopia_residents(p_limit int default 160)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'total', (select count(*) from nextopia.residents where not hidden),
    'counts', (select coalesce(json_object_agg(major, n), '{}'::json)
               from (select major, count(*) n from nextopia.residents where not hidden group by major) c),
    'residents', (select coalesce(json_agg(r), '[]'::json) from (
        select id, nickname, major, hair, hair_color, skin, acc, top
        from nextopia.residents where not hidden
        order by updated_at desc
        limit least(greatest(coalesce(p_limit, 160), 1), 300)) r)
  );
$$;

revoke all on function public.nextopia_join(text, text, text, int, int, int, int, int) from public;
revoke all on function public.nextopia_residents(int) from public;
grant execute on function public.nextopia_join(text, text, text, int, int, int, int, int) to anon, authenticated;
grant execute on function public.nextopia_residents(int) to anon, authenticated;
