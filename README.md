# Mídia Relevante

Aplicativo web para o planejamento de conteúdo e a comunicação da equipe de mídia da Igreja Relevante.

> O nome "Painel de Mídia" é **provisório** (definido em `lib/config.ts`). As cores e a fonte também são provisórias, inspiradas nas referências visuais, até chegar o guia de rebranding.

## Estado atual: login e escala da equipe

- Next.js (App Router) + TypeScript, responsivo, instalável como app (PWA) no iPhone.
- Login real com Supabase Auth (e-mail e senha). **Não existe cadastro público.**
- Todas as páginas exigem login. Contas novas nascem **inativas**.
- Menu inferior no celular e menu lateral em telas grandes.
- Equipe: cadastro e ativação/desativação de integrantes.
- Escala por data: atividade, responsabilidade, integrante responsável e observações.
- Banco: perfis, funções, equipe e atribuições protegidas por RLS.

## Montar uma escala

1. Em **Equipe**, cadastre os integrantes e suas áreas.
2. Em **Calendário**, escolha a data e adicione uma atividade, responsabilidade e pessoa.
3. Para uma instalação existente, execute primeiro `supabase/migrations/0002_escala_midia.sql` no SQL Editor do Supabase.

As demais áreas (eventos, conteúdo, design e compartilhamento) ainda não estão implementadas.

## Configuração (uma vez)

### 1. Supabase
1. Crie um projeto em supabase.com (plano gratuito).
2. Em **SQL Editor → New query**, execute `supabase/migrations/0001_fundacao.sql`, depois `supabase/migrations/0002_escala_midia.sql`.
3. Em **Authentication → Sign In / Providers**, **desative o cadastro público** (opção parecida com "Allow new users to sign up").
4. Em **Authentication → Users → Add user**, crie o usuário administrador (e-mail e senha, marque "Auto Confirm User"). O primeiro usuário criado vira administrador automaticamente.

### 2. Vercel
Em **Settings → Environment Variables**, crie estas duas variáveis (valores em Supabase → Project Settings → API):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública (anon / publishable) |

Conecte o repositório `gdsilv4/M-dia-relevante-` em **Settings → Git** e use a branch `main` como branch de produção. Depois, faça um deploy.

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
