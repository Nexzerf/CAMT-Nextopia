-- ==========================================================
-- CAMT NEXTOPIA — เพิ่ม/ลบของรางวัลเอง + คำนวณโอกาสอัตโนมัติจากจำนวนคน
--
-- โหมดอัตโนมัติ: ทุกครั้งที่สุ่ม โอกาสได้รางวัลแต่ละชิ้น
--   = จำนวนที่เหลือ ÷ จำนวนคนที่ยังไม่ได้เล่น (คนที่คาดว่าจะมา − คนที่เล่นไปแล้ว)
-- ของจึงทยอยออกตลอดทั้งวันและหมดพอดีเมื่อคนเล่นครบ
-- ถ้าคนมาเกินที่คาด ของที่เหลือจะถูกแจกให้คนถัดไปจนหมด (ไม่ค้าง)
-- ==========================================================

insert into nextopia.settings (key, value) values ('expected_players', '100') on conflict (key) do nothing;
insert into nextopia.settings (key, value) values ('auto_odds', 'true') on conflict (key) do nothing;

-- โอกาส (%) ของแต่ละรางวัล ณ ตอนนี้ ตามโหมดที่ตั้งไว้
create or replace function nextopia.current_odds()
returns table (prize_id text, pct numeric, auto boolean, expected int, played int, remain int)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_auto boolean := coalesce((select value from nextopia.settings where key = 'auto_odds'), 'false') = 'true';
  v_expected int := coalesce((select nullif(value, '')::int from nextopia.settings where key = 'expected_players'), 0);
  v_played int := (select count(*) from nextopia.spins);
  v_left int := (select coalesce(sum(stock - given), 0) from nextopia.prizes where enabled and given < stock);
  v_remain int;
begin
  v_auto := v_auto and v_expected > 0;
  v_remain := greatest(v_expected - v_played, v_left, 1);
  return query
    select p.id,
           case
             when not p.enabled or p.given >= p.stock then 0::numeric
             when v_auto then round(least(100, (p.stock - p.given) * 100.0 / v_remain), 3)
             else p.chance
           end,
           v_auto, v_expected, v_played, v_remain
    from nextopia.prizes p
    order by p.sort;
end $$;
revoke all on function nextopia.current_odds() from public, anon, authenticated;

-- ---------- หมุน (ใช้โอกาสจาก current_odds) ----------
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

  v_bytes := extensions.gen_random_bytes(4);
  v_r := ((get_byte(v_bytes,0)::float8 * 16777216 + get_byte(v_bytes,1) * 65536
          + get_byte(v_bytes,2) * 256 + get_byte(v_bytes,3)) / 4294967296.0) * 100;

  -- ล็อกแถวรางวัลที่ยังเหลือ → สุ่ม + ตัดสต็อกพร้อมกัน ไม่แจกเกิน
  for v_p in
    select p.id, p.name, p.emoji, o.pct
    from nextopia.prizes p
    join nextopia.current_odds() o on o.prize_id = p.id
    where p.enabled and p.given < p.stock and o.pct > 0
    order by p.sort
    for update of p
  loop
    v_acc := v_acc + v_p.pct;
    if v_r < v_acc then
      v_won_id := v_p.id; v_won_name := v_p.name; v_won_emoji := v_p.emoji;
      exit;
    end if;
  end loop;

  if v_won_id is not null then
    update nextopia.prizes set given = given + 1 where id = v_won_id and given < stock;
    if not found then
      v_won_id := null; v_won_name := null; v_won_emoji := null;
    else
      loop
        v_bytes := extensions.gen_random_bytes(5);
        v_code := 'NX-';
        for i in 0..4 loop
          v_code := v_code || substr(v_chars, (get_byte(v_bytes, i) % 32) + 1, 1);
        end loop;
        exit when not exists (select 1 from nextopia.spins where code = v_code);
      end loop;
    end if;
  end if;

  begin
    insert into nextopia.spins (device_id, kiosk, name, major, prize_id, code)
    values (p_device, v_kiosk, p_name, p_major, v_won_id, v_code)
    returning * into v_row;
  exception when unique_violation then
    raise exception 'already spun';
  end;

  return json_build_object('already', false, 'prize_id', v_won_id, 'code', v_code,
    'prize_name', v_won_name, 'emoji', v_won_emoji, 'time', v_row.created_at);
end $$;

-- ---------- Staff ----------
create or replace function public.nextopia_admin(p_pin text, p_action text, p_payload json default '{}'::json)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_item json;
  v_name text;
  v_icon text;
  v_stock int;
  v_note text := null;
begin
  if not nextopia.check_pin(p_pin) then
    return json_build_object('error', 'invalid pin');
  end if;

  if p_action = 'update_prizes' then
    for v_item in select * from json_array_elements(p_payload -> 'prizes') loop
      update nextopia.prizes set
        stock   = greatest(0, least(100000, coalesce((v_item ->> 'stock')::int, stock))),
        chance  = least(100, greatest(0, coalesce((v_item ->> 'chance')::numeric, chance))),
        enabled = coalesce((v_item ->> 'enabled')::boolean, enabled),
        name    = coalesce(nullif(left(trim(v_item ->> 'name'), 40), ''), name),
        emoji   = case when (v_item ->> 'icon') ~ '^[a-z0-9_]{1,20}$' then v_item ->> 'icon' else emoji end
      where id = v_item ->> 'id';
    end loop;
  elsif p_action = 'add_prize' then
    v_name := left(trim(coalesce(p_payload ->> 'name', '')), 40);
    v_icon := coalesce(p_payload ->> 'icon', 'trophy');
    v_stock := greatest(0, least(100000, coalesce((p_payload ->> 'stock')::int, 1)));
    if v_name = '' then return json_build_object('error', 'name required'); end if;
    if v_icon !~ '^[a-z0-9_]{1,20}$' then v_icon := 'trophy'; end if;
    insert into nextopia.prizes (id, name, emoji, stock, chance, enabled, sort)
    values ('p_' || substr(md5(gen_random_uuid()::text), 1, 8), v_name, v_icon, v_stock,
            least(100, greatest(0, coalesce((p_payload ->> 'chance')::numeric, 1))), true,
            coalesce((select max(sort) from nextopia.prizes), 0) + 1);
  elsif p_action = 'delete_prize' then
    if exists (select 1 from nextopia.spins where prize_id = p_payload ->> 'id') then
      update nextopia.prizes set enabled = false where id = p_payload ->> 'id';
      v_note := 'disabled';
    else
      delete from nextopia.prizes where id = p_payload ->> 'id';
    end if;
  elsif p_action = 'set_plan' then
    insert into nextopia.settings (key, value)
    values ('expected_players', greatest(0, least(100000, coalesce((p_payload ->> 'expected')::int, 0)))::text)
    on conflict (key) do update set value = excluded.value;
    insert into nextopia.settings (key, value)
    values ('auto_odds', case when coalesce((p_payload ->> 'auto')::boolean, false) then 'true' else 'false' end)
    on conflict (key) do update set value = excluded.value;
  elsif p_action = 'reset_all' then
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
    'note', v_note,
    'plan', (select json_build_object('auto', o.auto, 'expected', o.expected, 'played', o.played, 'remain', o.remain)
             from nextopia.current_odds() o limit 1),
    'plan_settings', json_build_object(
      'auto', coalesce((select value from nextopia.settings where key = 'auto_odds'), 'false') = 'true',
      'expected', coalesce((select nullif(value, '')::int from nextopia.settings where key = 'expected_players'), 0)),
    'prizes', (select coalesce(json_agg(json_build_object(
        'id', p.id, 'name', p.name, 'icon', p.emoji, 'stock', p.stock, 'given', p.given,
        'left', greatest(p.stock - p.given, 0), 'chance', p.chance, 'enabled', p.enabled,
        'now', o.pct) order by p.sort), '[]'::json)
      from nextopia.prizes p join nextopia.current_odds() o on o.prize_id = p.id),
    'total_spins', (select count(*) from nextopia.spins),
    'total_wins',  (select count(*) from nextopia.spins where prize_id is not null),
    'by_major', (select coalesce(json_object_agg(major, n), '{}'::json)
      from (select coalesce(major, '-') as major, count(*) n from nextopia.spins group by 1) t),
    'recent', (select coalesce(json_agg(r), '[]'::json) from (
      select s.created_at as time, s.name, s.major, s.prize_id, p.name as prize_name, p.emoji as icon, s.code, s.claimed_at, s.kiosk
      from nextopia.spins s left join nextopia.prizes p on p.id = s.prize_id
      order by s.created_at desc
      limit least(greatest(coalesce((p_payload ->> 'limit')::int, 300), 1), 20000)) r)
  );
end $$;

revoke all on function public.nextopia_spin(text, text, text, text) from public;
revoke all on function public.nextopia_admin(text, text, json) from public;
grant execute on function public.nextopia_spin(text, text, text, text) to anon, authenticated;
grant execute on function public.nextopia_admin(text, text, json) to anon, authenticated;
