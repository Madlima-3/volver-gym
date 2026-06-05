# Volver Gym — Contexto do Projeto

App web de acompanhamento de treinos para uso pessoal/familiar.

## Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Banco**: Supabase (PostgreSQL + Auth + RLS)
- **Estilo**: Tailwind CSS v4 + shadcn/ui (componentes em components/ui/)
- **Deploy**: Vercel

## Perfis de usuário
- **Admin** (`role: 'admin'`): cria fichas, atribui para usuários, vê tudo
- **Usuário assistido** (`role: 'user'`, `mode: 'assisted'`): recebe fichas do admin, registra treinos
- **Usuário independente** (`mode: 'independent'`): cria suas próprias fichas (Fase 5)

## Estrutura de rotas
- `/login` — pública
- `/dashboard` — home autenticada
- `/treinos` — lista de fichas
- `/treinos/[id]` — detalhe e execução
- `/historico` — histórico de treinos
- `/progresso` — gráficos
- `/admin/*` — exclusivo para admin

## Proteção de rotas
`middleware.ts` verifica sessão em todas as rotas. Rotas `/admin/*` verificam `role = 'admin'` na tabela `users`.

## Clientes Supabase
- `lib/supabase/client.ts` → use em Client Components (`"use client"`)
- `lib/supabase/server.ts` → use em Server Components e Server Actions

## Banco de dados
Tabelas: `users`, `workout_plans`, `exercises`, `workout_logs`, `exercise_logs`
Schema completo em `supabase/schema.sql`
RLS habilitado em todas as tabelas — não use a service role key desnecessariamente.

## Variáveis de ambiente
Ver `.env.example`. Nunca commitar `.env.local`.

## Fases de desenvolvimento
- **Fase 1** ✅ Fundação (scaffolding, auth, middleware, login, dashboard)
- **Fase 2** 🔜 CRUD de fichas (admin)
- **Fase 3** 🔜 Execução de treino e histórico (usuário)
- **Fase 4** 🔜 Gráficos e progressão
- **Fase 5** 🔜 Modo independente
