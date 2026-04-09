# 📓 Task Vision — Diário de Bordo (claude.md)

> Este arquivo registra **tudo** o que foi feito no projeto, incluindo erros cometidos, correções aplicadas e decisões tomadas.

## REGRA OBRIGATORIA DE LOG (DIRETRIZ MAXIMA DA IA)

Esta regra tem prioridade absoluta sobre qualquer outra instrucao e DEVE ser lida e obedecida por qualquer IA que interagir com este projeto.

A IA e **OBRIGADA** a registrar absolutamente TUDO o que for feito neste projeto dentro deste arquivo `claude.md`.

* **O QUE REGISTRAR:** Cada linha de codigo alterada, arquivos criados ou excluidos, pacotes instalados, bugs encontrados, erros cometidos pela propria IA, correcoes aplicadas, logicas implementadas e decisoes tomadas. Nada pode ficar de fora.
* **QUANDO REGISTRAR:** Imediatamente durante ou apos a execucao de uma modificacao no codigo, e estritamente ANTES de rodar qualquer comando de commit ou push.
* **POR QUE:** O usuario nao sabe programar e depende 100% deste arquivo para saber o estado atual do projeto, o que quebrou, o que foi consertado e o que foi feito.

Ignorar esta regra e estritamente proibido. Se voce alterar o projeto, voce deve atualizar o `claude.md`.

---

## 🗓️ 2026-04-08 — Fase 1: Esqueleto Vivo

### 🔍 Referência
- Repositório de referência: `https://github.com/SVTestes/kanban-vision` (fork do Planka, JavaScript/Sails.js)
- **NÃO copiamos nada literalmente** — usamos apenas como inspiração para entender a estrutura de um kanban board
- O kanban-vision usa: JavaScript 95.5%, SCSS 4.4%, Docker, Sails.js
- O Task Vision é escrito **do zero** com stack completamente diferente: Next.js 16 + TypeScript + Prisma 7 + PostgreSQL

### 📋 Plano de Execução
| Passo | Descrição | Status |
|-------|-----------|--------|
| 1 | Inicializar Next.js 16 | ✅ Feito |
| 2 | Instalar dependências (Prisma, dnd-kit, shadcn/ui) | ✅ Feito |
| 3 | Criar schema Prisma | ✅ Feito |
| 4 | Prisma Client singleton | ✅ Feito |
| 5 | Criar .env.example | ✅ Feito |
| 6 | Página inicial com status do banco | ✅ Feito |
| 7 | Scripts do package.json | ✅ Feito |
| 8 | Ajustar .gitignore | ✅ Feito |
| 9 | README.md em português | ✅ Feito |

---

### Passo 1 — Inicializar Next.js

**Início:** 17:47 BRT

**Comando:** `npx -y create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`

**🐛 Erro 1:** O `create-next-app` recusou porque o `claude.md` já existia na pasta. Erro: *"The directory taskvision contains files that could conflict: claude.md"*

**🔧 Correção 1:** Movi o `claude.md` temporariamente para `d:\claude\claude_temp.md`, rodei o create-next-app, e depois trouxe de volta.

**⚠️ Observação:** O `create-next-app@16.2.3` instalou Next.js 16 (não 15 como pedido no task original). Como é a versão mais recente estável, mantivemos.

**⚠️ Observação 2:** O Next.js 16 criou automaticamente um `AGENTS.md` na pasta (feature nova). Esse arquivo foi substituído pelo nosso `claude.md`.

**Resultado:** ✅ Projeto criado com sucesso em `D:\claude\taskvision`

---

### Passo 2 — Instalar dependências

**🐛 Erro 2:** O PowerShell não aceita `&&` para encadear comandos npm. Erro: *"O token '&&' não é um separador de instruções válido nesta versão."*

**🔧 Correção 2:** Rodei cada `npm install` separadamente em vez de encadear.

**Comandos executados:**
1. `npm install prisma --save-dev` ✅
2. `npm install @prisma/client @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` ✅
3. `npx prisma init` ✅ (criou `prisma/schema.prisma` e `prisma.config.ts`)
4. `npx shadcn@latest init --defaults --force` ✅ (instalou shadcn v4.2.0, criou `button.tsx` e `utils.ts`)

**⚠️ Observação sobre Prisma 7:** O `npx prisma init` criou um `prisma.config.ts` (novo no Prisma 7) e definiu o generator com `provider = "prisma-client"` (não mais `prisma-client-js`). O output padrão foi `../app/generated/prisma`.

**Resultado:** ✅ Todas as dependências instaladas

---

### Passo 3 — Schema do Prisma

Criado `prisma/schema.prisma` com 6 models + 1 enum:
- **User** — usuários do sistema
- **Workspace** — workspaces (grupos de quadros)
- **WorkspaceMember** — relação N:N entre User e Workspace com roles
- **Board** — quadros kanban dentro de um workspace
- **List** — listas dentro de um board
- **Card** — cards dentro de uma lista
- **Invitation** — convites para workspaces

Todos com `onDelete: Cascade` (exceto User, que é raiz).

**Resultado:** ✅ Schema criado

---

### Passo 4 — Prisma Client singleton

**🐛 Erro 3:** O import `@/app/generated/prisma` não foi resolvido pelo Turbopack durante o build. Erro: *"Module not found: Can't resolve '@/app/generated/prisma'"*

**🔧 Tentativa 1:** Troquei para import relativo `../app/generated/prisma`. **Falhou** — mesmo erro.

**🔧 Tentativa 2:** Mudei o output do Prisma de `app/generated/prisma` para `lib/generated/prisma` e usei `@/lib/generated/prisma`. **Falhou** — mesmo erro.

**🔧 Tentativa 3:** Usei import explícito `./generated/prisma/client`. **FUNCIONOU!** O Turbopack consegue resolver quando aponta diretamente para o arquivo `.ts` gerado.

**🐛 Erro 4:** Após resolver o import, o TypeScript reclamou: *"Expected 1 arguments, but got 0"* no `new PrismaClient()`.

**🔍 Investigação:** Consultei a documentação oficial do Prisma 7. Descobri que o Prisma 7 **requer** obrigatoriamente um "driver adapter" — não é mais possível instanciar `new PrismaClient()` sem argumento.

**🔧 Correção 4:** 
1. Instalei `@prisma/adapter-pg` e `pg` 
2. Reescrevi o singleton para criar um `PrismaPg` adapter com a `DATABASE_URL`
3. Passei `{ adapter }` para o constructor do `PrismaClient`

**Resultado:** ✅ Build passou

---

### Passo 5 — .env.example

Criado `.env.example` com todas as variáveis de ambiente documentadas em português.

**Resultado:** ✅ Arquivo criado

---

### Passo 6 — Página inicial

Criada `app/page.tsx` como Server Component com:
- Gradiente escuro de slate para indigo
- Ícone de clipboard com gradiente roxo
- Título "Task Vision" com gradiente no texto
- Subtítulo "Esqueleto vivo — Fase 1 ✅"
- Card de status do banco com try/catch no `prisma.user.count()`
- Badges da stack tech
- Rodapé "Feito por Carlos • SV Digital Ltda"

**🐛 Erro 5:** A mensagem de erro do banco era muito longa e técnica (Turbopack encodava nomes de módulos internos na mensagem). Tomava conta da tela inteira.

**🔧 Correção 5:** Adicionei truncamento da mensagem de erro para no máximo 100 caracteres.

**Resultado:** ✅ Página bonita e funcional

---

### Passo 7 — Scripts do package.json

Scripts configurados:
```json
{
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint .",
  "postinstall": "prisma generate",
  "db:push": "prisma db push",
  "db:studio": "prisma studio"
}
```

**🐛 Erro 6:** O `next lint` não funciona no Next.js 16 — dá erro *"Invalid project directory provided, no such directory: D:\claude\taskvision\lint"*

**🔧 Correção 6:** Troquei `next lint` por `eslint .` que funciona corretamente com o flat config do ESLint 9.

**Resultado:** ✅ Scripts funcionando

---

### Passo 8 — .gitignore

Ajustes feitos:
- `.env*` já estava ignorado (veio do create-next-app)
- Adicionei `!.env.example` para que o template de variáveis vá pro Git
- `/lib/generated/prisma` ignorado (client gerado pelo Prisma)
- `prisma/migrations` **NÃO** está ignorado (histórico de migrations deve ir pro Git)

**Resultado:** ✅ Gitignore correto

---

### Passo 9 — README.md

Criado README estilo "receita de bolo" com:
- Como rodar localmente (4 passos)
- Como subir pro GitHub (2 passos com comandos exatos)
- Como fazer deploy na Railway (6 passos)
- Tabela de variáveis de ambiente
- Tabela de comandos úteis
- Roadmap das fases

**Resultado:** ✅ README completo em português

---

### ✅ Verificação Final

| Check | Status |
|-------|--------|
| `npm run build` completa sem erros | ✅ |
| `npm run lint` passa sem erros | ✅ |
| Página abre em localhost:3000 | ✅ |
| Título "Task Vision" aparece | ✅ |
| Status do banco aparece (🔴 offline, como esperado) | ✅ |
| TypeScript strict ativado | ✅ |
| Cascade deletes no schema | ✅ |
| Sem autenticação (Fase 2) | ✅ |
| Sem UI de boards/cards (Fase 3-4) | ✅ |

---

### 📊 Resumo de Erros e Correções

| # | Erro | Causa | Correção |
|---|------|-------|----------|
| 1 | create-next-app recusa pasta com arquivos | claude.md existia na pasta | Movi temporariamente |
| 2 | `&&` não funciona no PowerShell | Sintaxe do PowerShell é diferente | Rodei comandos separados |
| 3 | Turbopack não resolve importações do Prisma gerado | Prisma 7 gera ESM com `import.meta.url` | Importei diretamente o `client.ts` |
| 4 | PrismaClient requer 1 argumento | Prisma 7 exige driver adapter | Adicionei `@prisma/adapter-pg` |
| 5 | Mensagem de erro muito longa | Turbopack encoda nomes internos | Truncamento para 100 chars |
| 6 | `next lint` não funciona no Next.js 16 | Bug/mudança na CLI | Troquei por `eslint .` |

---

### 🗂️ Estrutura Final do Projeto

```
taskvision/
├── app/
│   ├── globals.css              # Estilos globais (Tailwind + shadcn)
│   ├── layout.tsx               # Layout raiz (metadata, fontes)
│   └── page.tsx                 # Página inicial com status do banco
├── components/
│   └── ui/
│       └── button.tsx           # Componente button do shadcn
├── lib/
│   ├── generated/prisma/        # Client do Prisma (gerado, gitignored)
│   ├── prisma.ts                # Singleton do Prisma com adapter
│   └── utils.ts                 # Utilitário cn() do shadcn
├── prisma/
│   └── schema.prisma            # Schema do banco de dados
├── public/                      # Arquivos estáticos
├── .env                         # Variáveis de ambiente (gitignored)
├── .env.example                 # Template de variáveis
├── .gitignore                   # Arquivos ignorados pelo Git
├── claude.md                    # Este diário de bordo
├── components.json              # Config do shadcn
├── eslint.config.mjs            # Config do ESLint 9
├── next.config.ts               # Config do Next.js
├── package.json                 # Dependências e scripts
├── postcss.config.mjs           # Config do PostCSS
├── prisma.config.ts             # Config do Prisma 7
├── README.md                    # Guia em português
└── tsconfig.json                # Config do TypeScript (strict: true)
```

### ?? Git Push
O c�digo foi enviado com sucesso para o reposit�rio https://github.com/SVTestes/task-vision.git na branch main.

### ?? Ignorar README.md
 O arquivo "README.md" foi adicionado ao .gitignore e removido do reposit�rio no GitHub para que a documenta��o local nunca seja compartilhada externamente.

---

## 2026-04-09 — Fase 2: Autenticacao

### Referencia
- Baseado no sistema de auth do kanban-vision (Planka fork)
- Sem cadastro publico — admin cria usuarios manualmente
- Login com email/username + senha
- Senhas com bcrypt (10 rounds)
- Sessoes com JWT + cookie HTTP-only duplo (accessToken + httpOnlyToken)

### Plano de Execucao
| Passo | Descricao | Status |
|-------|-----------|--------|
| 1 | Instalar dependencias (bcrypt, jsonwebtoken, uuid, tsx) | Feito |
| 2 | Atualizar schema Prisma (User + Session + UserRole enum) | Feito |
| 3 | Atualizar .env.example (JWT_SECRET, DEFAULT_ADMIN_*) | Feito |
| 4 | Criar lib de auth (password, jwt, session, get-current-user) | Feito |
| 5 | Criar API routes (login, logout, me, users CRUD, password) | Feito |
| 6 | Criar middleware.ts de protecao de rotas | Feito |
| 7 | Instalar componentes shadcn (input, label, card, dialog, table, badge, dropdown-menu, separator, avatar) | Feito |
| 8 | Criar pagina de login | Feito |
| 9 | Criar layout do dashboard com nav | Feito |
| 10 | Criar painel admin de usuarios | Feito |
| 11 | Criar seed do admin padrao | Feito |

### Mudancas no Schema Prisma
- **User**: adicionados campos `password`, `username` (unique), `role` (UserRole enum), `isDeactivated`, `passwordChangedAt`. Removido `image`. Campo `name` agora e obrigatorio.
- **Session**: novo model com `accessToken` (unique), `httpOnlyToken` (unique), `userId`, `remoteAddress`, `userAgent`, `expiresAt`
- **UserRole**: novo enum (ADMIN, PROJECT_OWNER, MEMBER)

### Arquivos Criados
- `lib/auth/password.ts` — hashPassword() e verifyPassword() com bcrypt
- `lib/auth/jwt.ts` — createToken() e verifyToken() com jsonwebtoken
- `lib/auth/session.ts` — createSession(), getSessionByToken(), deleteSession()
- `lib/auth/get-current-user.ts` — getCurrentUser(), requireUser(), requireAdmin()
- `app/api/auth/login/route.ts` — POST login com email/username + senha
- `app/api/auth/logout/route.ts` — DELETE logout (limpa sessao e cookies)
- `app/api/auth/me/route.ts` — GET usuario atual
- `app/api/users/route.ts` — GET listar + POST criar (admin only)
- `app/api/users/[id]/route.ts` — GET, PATCH, DELETE usuario
- `app/api/users/[id]/password/route.ts` — PATCH alterar senha
- `middleware.ts` — protege rotas, redireciona para /login se nao autenticado
- `app/login/page.tsx` — pagina de login (dark theme, gradiente indigo/violet)
- `app/(dashboard)/layout.tsx` — layout protegido com nav
- `app/(dashboard)/page.tsx` — dashboard inicial (placeholder para workspaces)
- `app/(dashboard)/admin/users/page.tsx` — painel admin (CRUD de usuarios)
- `components/dashboard-nav.tsx` — barra de navegacao com menu do usuario
- `prisma/seed.ts` — cria admin padrao a partir de env vars

### Erros e Correcoes
| # | Erro | Causa | Correcao |
|---|------|-------|----------|
| 7 | `asChild` prop nao existe no DialogTrigger/DropdownMenuTrigger | shadcn v4 usa base-ui em vez de Radix | Troquei para prop `render` do base-ui |
| 8 | Build falhou por referencia ao antigo app/page.tsx no cache .next | Cache do Turbopack manteve referencia ao arquivo deletado | Limpei .next e reconstrui |

### Fluxo de Auth
1. Deploy inicial → `npm run db:seed` → cria admin com DEFAULT_ADMIN_*
2. Admin acessa /login → digita email + senha
3. POST /api/auth/login → bcrypt.compare → cria Session → seta cookies httpOnly
4. Middleware verifica cookie em todas as rotas → permite ou redireciona para /login
5. Admin vai em /admin/users → cria novos usuarios com email + senha
6. Novo usuario acessa /login → usa credenciais que o admin forneceu

### Estrutura Atualizada
```
taskvision/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Layout protegido com nav
│   │   ├── page.tsx                 # Dashboard (placeholder workspaces)
│   │   └── admin/users/page.tsx     # Painel admin de usuarios
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # POST login
│   │   │   ├── logout/route.ts      # DELETE logout
│   │   │   └── me/route.ts          # GET usuario atual
│   │   └── users/
│   │       ├── route.ts             # GET listar + POST criar
│   │       └── [id]/
│   │           ├── route.ts         # GET, PATCH, DELETE
│   │           └── password/route.ts # PATCH alterar senha
│   ├── login/page.tsx               # Pagina de login
│   ├── globals.css
│   ├── layout.tsx
│   └── favicon.ico
├── components/
│   ├── dashboard-nav.tsx            # Nav bar
│   └── ui/                          # shadcn components
├── lib/
│   ├── auth/
│   │   ├── password.ts              # bcrypt hash/verify
│   │   ├── jwt.ts                   # JWT create/verify
│   │   ├── session.ts               # Session CRUD
│   │   └── get-current-user.ts      # Auth helpers
│   ├── generated/prisma/            # Prisma client (gitignored)
│   ├── prisma.ts                    # Prisma singleton
│   └── utils.ts                     # cn() helper
├── prisma/
│   ├── schema.prisma                # Schema atualizado
│   └── seed.ts                      # Seed do admin
├── middleware.ts                     # Protecao de rotas
└── ...
```

---

## 2026-04-09 — Fase 3, Etapa 1: Criacao e Listagem de Workspaces

### Status anterior
- Fase 2 (autenticacao) esta 100% concluida e em producao no Railway
- Login, logout, middleware, painel admin de usuarios — tudo funcionando

### Referencia
- Analisamos `https://github.com/SVTestes/kanban-vision` (Planka fork) para entender como Projects/Boards funcionam
- No Planka, "Project" = nosso "Workspace". Cards em grid responsiva com gradientes CSS coloridos
- Modal de criacao com nome + descricao, auto-membership do criador como manager
- 25 gradientes CSS pre-definidos para fundo dos cards

### Plano desta Etapa
| Passo | Descricao | Status |
|-------|-----------|--------|
| 1 | Ajustar schema Prisma (description, backgroundGradient no Workspace) | Feito |
| 2 | Criar helpers (slugify, workspace-gradients) | Feito |
| 3 | Criar API routes workspaces CRUD | Feito |
| 4 | Criar componente workspace-card | Feito |
| 5 | Criar modal de criacao de workspace | Feito |
| 6 | Atualizar dashboard com grid de workspaces | Feito |
| 7 | Build + lint + commit + push | Feito |

### Mudancas no Schema Prisma
- **Workspace**: adicionados campos `description` (String?, VarChar(1024)) e `backgroundGradient` (String?)
- Demais models sem alteracao

### Arquivos Criados
- `lib/slugify.ts` — slugify() e slugifyWithSuffix() para gerar URLs amigaveis
- `lib/workspace-gradients.ts` — 25 gradientes CSS (Planka), getRandomGradient(), getGradientByName()
- `app/api/workspaces/route.ts` — GET listar + POST criar (com transacao: workspace + membership OWNER)
- `app/api/workspaces/[id]/route.ts` — GET, PATCH, DELETE workspace (com controle de acesso)
- `components/workspace-card.tsx` — card com gradiente, nome, descricao, contagem boards/members
- `components/create-workspace-modal.tsx` — dialog base-ui com nome + descricao, faz POST e router.refresh()

### Arquivos Modificados
- `app/(dashboard)/page.tsx` — substituido placeholder por grid responsiva de WorkspaceCards + empty state + botao criar
- `prisma/schema.prisma` — adicionados 2 campos ao Workspace

### Decisoes Tecnicas
- Slug gerado com sufixo aleatorio (4 chars) para evitar colisoes: "meu-projeto-abc1"
- Gradiente atribuido aleatoriamente ao criar (dos 25 presets do Planka)
- Transacao Prisma garante que workspace + membership sao criados juntos
- Dashboard usa Server Component com query direta ao Prisma (sem fetch API)
- Grid responsiva: 1 col mobile, 2 sm, 3 lg, 4 xl

### Erros e Correcoes
- Nenhum erro nesta etapa. Build e lint passaram de primeira

---

## Fluxo de Deploy - REGRA OBRIGATORIA

Esta regra deve ser seguida sem excecoes em todas as interacoes com este projeto.

### Antes de qualquer edicao:
- SEMPRE executar git pull origin main antes de comecar qualquer mudanca
- Informar o resultado do pull: avisar se havia novidades (e quais arquivos mudaram) ou se ja estava atualizado

### Ao fazer alteracoes:
- SEMPRE fazer push direto para a branch main - nunca criar branches separadas
- Commitar e dar push a cada mudanca concluida - nao acumular alteracoes
- O Railway faz auto-deploy automaticamente ao detectar push na main
- Nao ha ambiente local de testes - o codigo vai direto para producao

### Em caso de problemas:
- Reverter via Git: git revert seguido de push

### Fluxo padrao:
1. git pull origin main  (SEMPRE antes de editar)
2. Fazer as alteracoes
3. git add .
4. git commit -m descricao
5. git push origin main  (Railway faz deploy automatico)

---

## Regra de Teste via Navegador (REGRA OBRIGATORIA)

Esta regra deve ser seguida por qualquer IA que tenha capacidade de abrir e interagir com um navegador.

### Quando testar via navegador:
- **SEMPRE** apos fazer deploy de uma alteracao visual (paginas, componentes, estilos)
- **SEMPRE** quando o usuario reportar um bug visual ou erro em producao
- **SEMPRE** quando criar uma nova rota/pagina — verificar se carrega corretamente
- **ANTES** de declarar uma tarefa como concluida, se envolve UI

### Como testar:
1. Abrir o navegador na URL de producao: `https://task-vision-production.up.railway.app/`
2. Se necessario fazer login, usar as credenciais do admin (email/senha das env vars)
3. Navegar ate a pagina alterada e verificar visualmente
4. Capturar screenshot se relevante
5. Reportar o resultado ao usuario

### URLs importantes:
- **Producao:** `https://task-vision-production.up.railway.app/`
- **Login:** `https://task-vision-production.up.railway.app/login`
- **Admin:** `https://task-vision-production.up.railway.app/admin/users`

### Objetivo:
O usuario nao sabe programar e depende da IA para verificar se as mudancas estao funcionando corretamente em producao. A IA deve ser proativa em testar via navegador sempre que possivel.

---

## 2026-04-09 — Fase 3, Etapa 1: Correcao — Pagina de Detalhe do Workspace

### Problema Encontrado
- Ao clicar no card de um workspace no dashboard, o usuario era levado para `/workspaces/[id]`
- Essa rota retornava **404** porque nao existia uma pagina (page.tsx) para ela
- Apenas a API route `/api/workspaces/[id]` existia, mas nao a pagina visual

### Correcao Aplicada
- Criado `app/(dashboard)/workspaces/[id]/page.tsx` — pagina de detalhe do workspace

### O que a pagina inclui:
- **Breadcrumb** navegavel: Workspaces > Nome do Workspace
- **Header** com gradiente do workspace, nome, descricao, contagem de boards/membros, e nome do criador
- **Secao de Boards** com grid responsiva (ou empty state se nao houver boards)
- **Secao de Membros** com cards mostrando avatar, nome e role (Dono/Admin/Membro)
- **Controle de acesso:** somente owner, membros e admins podem ver

### Verificacao:
- `npm run build` — compilou sem erros, nova rota `ƒ /workspaces/[id]` aparece
- `npm run lint` — sem erros

### Arquivos Criados:
- `app/(dashboard)/workspaces/[id]/page.tsx`

### Arquivos Modificados:
- `.gitignore` — adicionado `.claude/` para ignorar configs locais da IDE