# Painel de Mídia — Igreja Relevante

Next.js + TypeScript + Supabase (banco, auth, storage) + Vercel. PWA instalável.

- Módulos: dashboard, calendário (mês/semana/dia), conteúdos, designers (demandas), equipe e permissões, arquivos, compartilhamento somente leitura (revogável), configurações.
- Segurança: RLS em todas as tabelas, sem cadastro público, criação de usuários só via Edge Function `admin-users` (service_role fica apenas no Supabase).
- Variáveis (Vercel): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `..._ANON_KEY`). Nunca use service_role no app.
- Banco: migrações aplicadas no projeto Supabase `painel-midia.`; função em `supabase/functions/admin-users`.
- Integração com Instagram/Meta: não ativa (exige app Meta e permissões aprovadas).
