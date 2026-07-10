-- ============================================================
-- GymApp — Schema inicial (Fase 1)
-- Rodar no Supabase SQL Editor: supabase.com > seu projeto > SQL Editor
-- ============================================================

-- Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- Tabela: users
-- Estende o auth.users do Supabase Auth com dados do perfil
-- ============================================================
create table public.users (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  name        text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  mode        text not null default 'assisted' check (mode in ('assisted', 'independent')),
  invited_by  uuid references public.users(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- Tabela: workout_plans (fichas de treino)
-- ============================================================
create table public.workout_plans (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  description  text,
  created_by   uuid references public.users(id) not null,
  assigned_to  uuid references public.users(id),
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- ============================================================
-- Tabela: exercises (exercícios de uma ficha)
-- ============================================================
create table public.exercises (
  id               uuid default uuid_generate_v4() primary key,
  workout_plan_id  uuid references public.workout_plans(id) on delete cascade not null,
  name             text not null,
  sets             integer,
  reps             text,          -- ex: "8-12" ou "10"
  suggested_weight numeric,
  order_index      integer default 0,
  notes            text
);

-- ============================================================
-- Tabela: workout_logs (execuções de treino)
-- ============================================================
create table public.workout_logs (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.users(id) not null,
  workout_plan_id  uuid references public.workout_plans(id) not null,
  executed_at      timestamptz default now(),
  notes            text,
  admin_feedback   text,
  status           text not null default 'completed' check (status in ('in_progress', 'completed'))
);

-- Migração (para banco existente — rodar no SQL Editor):
-- ALTER TABLE public.workout_logs
--   ADD COLUMN status text NOT NULL DEFAULT 'completed'
--   CHECK (status IN ('in_progress', 'completed'));

-- ============================================================
-- Tabela: exercise_logs (execução por exercício)
-- ============================================================
create table public.exercise_logs (
  id              uuid default uuid_generate_v4() primary key,
  workout_log_id  uuid references public.workout_logs(id) on delete cascade not null,
  exercise_id     uuid references public.exercises(id) not null,
  sets_done       integer,
  reps_done       text,
  weight_used     numeric,
  notes           text
);

-- ============================================================
-- Row Level Security (RLS)
-- Garante que usuários só acessem seus próprios dados
-- ============================================================
alter table public.users enable row level security;
alter table public.workout_plans enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.exercise_logs enable row level security;

-- Helper: verifica se o usuário atual é admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- ---- Políticas: users ----

create policy "Usuário vê seu próprio perfil"
  on public.users for select
  using (auth.uid() = id);

create policy "Admin vê todos os usuários"
  on public.users for select
  using (public.is_admin());

create policy "Admin insere usuários"
  on public.users for insert
  with check (public.is_admin());

create policy "Admin atualiza usuários"
  on public.users for update
  using (public.is_admin());

create policy "Usuário atualiza próprio perfil"
  on public.users for update
  using (auth.uid() = id);

-- ---- Políticas: workout_plans ----

create policy "Usuário vê fichas atribuídas a ele"
  on public.workout_plans for select
  using (assigned_to = auth.uid() or created_by = auth.uid());

create policy "Admin vê todas as fichas"
  on public.workout_plans for select
  using (public.is_admin());

create policy "Admin cria fichas"
  on public.workout_plans for insert
  with check (public.is_admin());

create policy "Admin atualiza fichas"
  on public.workout_plans for update
  using (public.is_admin());

create policy "Admin deleta fichas"
  on public.workout_plans for delete
  using (public.is_admin());

-- ---- Políticas: exercises ----

create policy "Usuário vê exercícios de fichas atribuídas"
  on public.exercises for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_plan_id
        and (wp.assigned_to = auth.uid() or wp.created_by = auth.uid())
    )
  );

create policy "Admin vê todos os exercícios"
  on public.exercises for select
  using (public.is_admin());

create policy "Admin gerencia exercícios"
  on public.exercises for all
  using (public.is_admin());

-- ---- Políticas: workout_logs ----

create policy "Usuário vê seus próprios logs"
  on public.workout_logs for select
  using (user_id = auth.uid());

create policy "Usuário registra seus próprios logs"
  on public.workout_logs for insert
  with check (user_id = auth.uid());

create policy "Usuário atualiza seus próprios logs"
  on public.workout_logs for update
  using (user_id = auth.uid());

create policy "Admin vê todos os logs"
  on public.workout_logs for select
  using (public.is_admin());

create policy "Admin dá feedback nos logs"
  on public.workout_logs for update
  using (public.is_admin());

create policy "Usuário deleta seus próprios logs"
  on public.workout_logs for delete
  using (user_id = auth.uid());

create policy "Admin deleta logs"
  on public.workout_logs for delete
  using (public.is_admin());

-- ---- Políticas: exercise_logs ----

create policy "Usuário vê seus exercise_logs"
  on public.exercise_logs for select
  using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = workout_log_id and wl.user_id = auth.uid()
    )
  );

create policy "Usuário registra seus exercise_logs"
  on public.exercise_logs for insert
  with check (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = workout_log_id and wl.user_id = auth.uid()
    )
  );

create policy "Admin vê todos os exercise_logs"
  on public.exercise_logs for select
  using (public.is_admin());

create policy "Usuário deleta seus exercise_logs"
  on public.exercise_logs for delete
  using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = workout_log_id and wl.user_id = auth.uid()
    )
  );

create policy "Admin deleta exercise_logs"
  on public.exercise_logs for delete
  using (public.is_admin());

-- ============================================================
-- Trigger: cria perfil em public.users ao criar usuário no Auth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Promover primeiro usuário a admin (rode APÓS criar sua conta)
-- Substitua 'seu@email.com' pelo seu email real
-- ============================================================
-- update public.users set role = 'admin' where email = 'seu@email.com';
