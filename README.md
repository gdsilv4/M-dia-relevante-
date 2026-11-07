# Mídia Relevante

Aplicativo web para o planejamento de conteúdo e a comunicação da equipe de mídia da Igreja Relevante.

> O nome "Painel de Mídia" é **provisório** (definido em `lib/config.ts`). As cores e a fonte também são provisórias, inspiradas nas referências visuais, até chegar o guia de rebranding.

## Estado atual: Etapa 1 (fundação)

- Next.js (App Router) + TypeScript, responsivo, instalável como app (PWA) no iPhone.
- Login real com Supabase Auth (e-mail e senha). **Não existe cadastro público.**
- Todas as páginas exigem login. Contas novas nascem **inativas**.
- Menu inferior no celular e menu lateral em telas grandes.
- Banco preparado com usuários (perfis), funções e plataformas (Instagram).
- Calendário, eventos, conteúdo, design, compartilhamento e equipe aparecem como "Em breve".

## Configuração (uma vez)

### 1. Supabase
1. Crie um projeto em supabase.com (plano gratuito).
2. Abra **SQL Editor → New query**, cole o conteúdo de `supabase/migrations/0001_fundacao.sql` e toque em **Run**.
3. Em **Authentication → Sign In / Providers**, **desative o cadastro público** (opção parecida com "Allow new users to sign up").
4. Em **Authentication → Users → Add user**, crie o seu usuário administrador (e-mail e a sua senha, marque "Auto Confirm User"). O primeiro usuário criado vira administrador automaticamente.

### 2. Vercel
Em **Settings → Environment Variables**, crie estas duas variáveis (valores em Supabase → Project Settings → API):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública (anon / publishable) |

Depois, faça um novo deploy (Deployments → ⋯ → Redeploy).

**Nunca** use a chave `service_role` / secret no app nem a coloque no GitHub.

## Estrutura

```
app/
  login/          tela de entrada
  sem-acesso/     conta sem permissão
  (app)/          área protegida (início, calendário, eventos, conteúdo, design, equipe, compartilhar, mais)
  actions/auth.ts entrar e sair (servidor)
components/       navegação, logotipo provisório, ícones
lib/              configuração, Supabase, formatação
supabase/migrations/   scripts do banco
middleware.ts     renova a sessão e protege as rotas
```
