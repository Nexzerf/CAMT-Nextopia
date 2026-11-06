-- ==========================================================
-- CAMT NEXTOPIA — ระบบวงล้อรางวัลบน Supabase
-- ตารางทั้งหมดอยู่ใน schema "nextopia" (ไม่เปิดให้ API เข้าถึงตรง ๆ)
-- เว็บเรียกได้เฉพาะฟังก์ชัน public.nextopia_* เท่านั้น
-- การสุ่ม + ตัดสต็อก ทำในฐานข้อมูลแบบ atomic → ไม่มีทางแจกเกินจำนวนจริง
-- ==========================================================

create schema if not exists nextopia;
revoke all on schema nextopia from public, anon, authenticated;

create table if not exists nextopia.prizes (
  id      text primary key,
  name    text not null,
  emoji   text not null default 'gift', -- ชื่อไอคอน
  stock   int  not null check (stock >= 0),
  given   int  not null default 0 check (given >= 0),
  chance  numeric(6,3) not null check (chance >= 0 and chance <= 100), -- % ต่อการหมุน
  enabled boolean not null default true,
  sort    int not null default 0
);

create table if not exists nextopia.spins (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id  text not null,
  kiosk      boolean not null default false,
  name       text,
  major      text,
  prize_id   text references nextopia.prizes(id),
  code       text unique,
  claimed_at timestamptz
);
-- มือถือ 1 เครื่อง หมุนได้ 1 ครั้ง (ยกเว้นเครื่องบูธ)
create unique index if not exists spins_one_per_device on nextopia.spins (device_id) where not kiosk;
create index if not exists spins_created on nextopia.spins (created_at desc);
create index if not exists spins_prize on nextopia.spins (prize_id);

create table if not exists nextopia.settings (
  key   text primary key,
  value text not null
);

create table if not exists nextopia.pin_failures (
  at timestamptz not null default now()
);

alter table nextopia.prizes       enable row level security;
alter table nextopia.spins        enable row level security;
alter table nextopia.settings     enable row level security;
alter table nextopia.pin_failures enable row level security;
revoke all on all tables in schema nextopia from public, anon, authenticated;

insert into nextopia.prizes (id, name, emoji, stock, chance, sort) values
  ('clicker1', 'คลิกเกอร์ 1 ปุ่ม', 'clicker1', 5, 1.00, 1),
  ('clicker3', 'คลิกเกอร์ 3 ปุ่ม', 'clicker3', 5, 0.80, 2),
  ('bag',      'กระเป๋า CAMT',    'bag', 2, 0.25, 3),
  ('mug',      'แก้วน้ำ CAMT',    'mug', 2, 0.25, 4)
on conflict (id) do nothing;

-- PIN สตาฟถูกตั้งแยกตอนติดตั้ง (เก็บเป็น bcrypt hash) ไม่ใส่ไว้ในไฟล์นี้
-- insert into nextopia.settings values ('pin', extensions.crypt('<PIN>', extensions.gen_salt('bf')));

-- ---------- helper: ตรวจ PIN (+ กันเดา PIN รัว ๆ) ----------
create or replace function nextopia.check_pin(p_pin text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare h text;
begin
  if (select count(*) from nextopia.pin_failures where at > now() - interval '5 minutes') >= 20 then
    raise exception 'too many attempts, wait 5 minutes';
  end if;
  select value into h from nextopia.settings where key = 'pin';
  if h is not null and p_pin is not null and h = extensions.crypt(p_pin, h) then
    return true;
  end if;
  insert into nextopia.pin_failures default values;
  delete from nextopia.pin_failures where at < now() - interval '1 hour';
  return false;
end $$;

-- ---------- สถานะรางวัล (สาธารณะ — ไม่เปิดเผย % โอกาส) ----------
create or replace function public.nextopia_status()
returns json language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', id, 'name', name, 'emoji', emoji, 'stock', stock,
    'left', greatest(stock - given, 0), 'available', enabled and given < stock
  ) order by sort), '[]'::json)
  from nextopia.prizes;
$$;

-- ---------- หมุนวงล้อ ----------
create or replace function public.nextopia_spin(
  p_device text, p_name text default null, p_major text default null, p_kiosk_pin text default null
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_kiosk boolean := false;
  v_prev  nextopia.spins;
  v_r     float8;
  v_acc   float8 := 0;
  v_p     record;
  v_won_id    text := null;
  v_won_name  text := null;
  v_won_emoji text := null;
  v_code  text := null;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_tag   text;
  v_row   nextopia.spins;
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then
    raise exception 'invalid device';
  end if;
  p_name  := left(nullif(trim(p_name), ''), 20);
  p_major := left(p_major, 8);

  if p_kiosk_pin is not null then
    v_kiosk := nextopia.check_pin(p_kiosk_pin);
    if not v_kiosk then return json_build_object('error', 'invalid kiosk pin'); end if;
  end if;

  if not v_kiosk then
    select * into v_prev from nextopia.spins where device_id = p_device and not kiosk;
    if found then
      return json_build_object('already', true, 'prize_id', v_prev.prize_id, 'code', v_prev.code,
        'time', v_prev.created_at,
        'prize_name', (select name from nextopia.prizes where id = v_prev.prize_id),
        'emoji', (select emoji from nextopia.prizes where id = v_prev.prize_id));
    end if;
  end if;

  -- สุ่มจาก byte แบบ crypto
  v_bytes := extensions.gen_random_bytes(4);
  v_r := ((get_byte(v_bytes,0)::float8 * 16777216 + get_byte(v_bytes,1) * 65536
          + get_byte(v_bytes,2) * 256 + get_byte(v_bytes,3)) / 4294967296.0) * 100;

  -- ล็อกแถวรางวัลที่ยังเหลือ → สุ่ม + ตัดสต็อกพร้อมกัน ไม่แจกเกิน
  for v_p in
    select id, name, emoji, chance from nextopia.prizes
    where enabled and given < stock and chance > 0
    order by sort for update
  loop
    v_acc := v_acc + v_p.chance;
    if v_r < v_acc then
      v_won_id := v_p.id; v_won_name := v_p.name; v_won_emoji := v_p.emoji;
      exit;
    end if;
  end loop;

  if v_won_id is not null then
    update nextopia.prizes set given = given + 1 where id = v_won_id;
    v_tag := case v_won_id when 'clicker1' then 'C1' when 'clicker3' then 'C3'
                           when 'bag' then 'BG' when 'mug' then 'MG' else 'PZ' end;
    loop
      v_bytes := extensions.gen_random_bytes(5);
      v_code := 'NX-' || v_tag || '-';
      for i in 0..4 loop
        v_code := v_code || substr(v_chars, (get_byte(v_bytes, i) % 32) + 1, 1);
      end loop;
      exit when not exists (select 1 from nextopia.spins where code = v_code);
    end loop;
  end if;

  begin
    insert into nextopia.spins (device_id, kiosk, name, major, prize_id, code)
    values (p_device, v_kiosk, p_name, p_major, v_won_id, v_code)
    returning * into v_row;
  exception when unique_violation then
    -- กดหมุนซ้ำพร้อมกันจากเครื่องเดียว → ยกเลิกรอบนี้ทั้งหมด (รวมการตัดสต็อก)
    raise exception 'already spun';
  end;

  return json_build_object('already', false, 'prize_id', v_won_id, 'code', v_code,
    'prize_name', v_won_name, 'emoji', v_won_emoji, 'time', v_row.created_at);
end $$;

-- ---------- Staff Console ----------
create or replace function public.nextopia_admin(p_pin text, p_action text, p_payload json default '{}'::json)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_item json;
begin
  if not nextopia.check_pin(p_pin) then
    return json_build_object('error', 'invalid pin');
  end if;

  if p_action = 'update_prizes' then
    for v_item in select * from json_array_elements(p_payload -> 'prizes') loop
      update nextopia.prizes set
        stock   = greatest(0, (v_item ->> 'stock')::int),
        chance  = least(100, greatest(0, (v_item ->> 'chance')::numeric)),
        enabled = (v_item ->> 'enabled')::boolean
      where id = v_item ->> 'id';
    end loop;
  elsif p_action = 'reset_all' then
    -- ล้างยอดแจกและประวัติทั้งหมด (ใช้ก่อนเริ่มงานจริง)
    delete from nextopia.spins where true;
    update nextopia.prizes set given = 0 where true;
    delete from nextopia.residents where true;
  elsif p_action = 'claim' then
    update nextopia.spins set claimed_at = coalesce(claimed_at, now())
    where code = upper(trim(p_payload ->> 'code'));
  elsif p_action = 'hide_resident' then
    update nextopia.residents set hidden = true where id = (p_payload ->> 'id')::uuid;
  elsif p_action = 'set_pin' then
    if length(coalesce(p_payload ->> 'new_pin', '')) < 4 then raise exception 'pin too short'; end if;
    update nextopia.settings set value = extensions.crypt(p_payload ->> 'new_pin', extensions.gen_salt('bf'))
    where key = 'pin';
  elsif p_action <> 'status' then
    raise exception 'unknown action';
  end if;

  return json_build_object(
    'prizes', (select coalesce(json_agg(json_build_object(
        'id', id, 'name', name, 'emoji', emoji, 'stock', stock, 'given', given,
        'left', greatest(stock - given, 0), 'chance', chance, 'enabled', enabled) order by sort), '[]'::json)
      from nextopia.prizes),
    'total_spins', (select count(*) from nextopia.spins),
    'total_wins',  (select count(*) from nextopia.spins where prize_id is not null),
    'residents_total', (select count(*) from nextopia.residents where not hidden),
    'residents', (select coalesce(json_agg(r), '[]'::json) from (
      select id, nickname, major, updated_at from nextopia.residents where not hidden
      order by updated_at desc limit 100) r),
    'by_major', (select coalesce(json_object_agg(major, n), '{}'::json)
      from (select coalesce(major, '-') as major, count(*) n from nextopia.spins group by 1) t),
    'recent', (select coalesce(json_agg(r), '[]'::json) from (
      select s.created_at as time, s.name, s.major, s.prize_id, p.name as prize_name, p.emoji, s.code, s.claimed_at, s.kiosk
      from nextopia.spins s left join nextopia.prizes p on p.id = s.prize_id
      order by s.created_at desc
      limit least(greatest(coalesce((p_payload ->> 'limit')::int, 300), 1), 20000)) r),
    'lookup', case when p_payload ->> 'code' is not null then (
      select row_to_json(x) from (
        select s.created_at as time, s.name, s.major, p.name as prize_name, s.code, s.claimed_at
        from nextopia.spins s left join nextopia.prizes p on p.id = s.prize_id
        where s.code = upper(trim(p_payload ->> 'code'))) x) end
  );
end $$;

revoke all on function nextopia.check_pin(text) from public, anon, authenticated;
revoke all on function public.nextopia_status() from public;
revoke all on function public.nextopia_spin(text, text, text, text) from public;
revoke all on function public.nextopia_admin(text, text, json) from public;
grant execute on function public.nextopia_status() to anon, authenticated;
grant execute on function public.nextopia_spin(text, text, text, text) to anon, authenticated;
grant execute on function public.nextopia_admin(text, text, json) to anon, authenticated;
