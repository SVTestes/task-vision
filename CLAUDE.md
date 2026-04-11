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

## 2026-04-09 — Fase 3, Etapa 2: Interface Visual do Board (Kanban Trello-like)

### Status anterior
- Fase 3, Etapa 1 (workspaces) concluida — criacao, listagem, API CRUD, cards com gradiente
- Pagina de detalhe do workspace criada em `app/(dashboard)/workspaces/[id]/page.tsx`

### Referencia
- Interface inspirada no Trello classico: listas horizontais, cards empilhados, fundo com gradiente
- Layout fullscreen sem scroll vertical — apenas scroll horizontal entre listas
- Dados mockados (falsos) para testar a UI antes de plugar no banco

### Plano desta Etapa
| Passo | Descricao | Status |
|-------|-----------|--------|
| 1 | Criar layout especial para boards (fullscreen) | Feito |
| 2 | Criar componente BoardHeader | Feito |
| 3 | Criar componente KanbanCard | Feito |
| 4 | Criar componente KanbanList | Feito |
| 5 | Criar pagina do board com mock data | Feito |
| 6 | Build + lint + commit + push | Feito |

### Arquivos Criados
- `app/(dashboard)/boards/layout.tsx` — layout fullscreen: h-[calc(100vh-4rem)] abaixo da nav
- `app/(dashboard)/boards/[id]/page.tsx` — pagina do board com mock data (3 listas, 9 cards)
- `components/board/board-header.tsx` — barra com breadcrumb (workspace > board), fundo translucido
- `components/board/kanban-list.tsx` — coluna com titulo, area de cards scrollavel, botao adicionar card
- `components/board/kanban-card.tsx` — card branco com sombra, hover cinza, titulo em texto escuro

### Decisoes Tecnicas
- Layout do board usa `h-[calc(100vh-4rem)]` para ocupar toda a tela menos a nav (64px)
- Fundo gradiente `from-purple-600 via-violet-500 to-pink-400` (inspirado na screenshot do Trello)
- Board header com `bg-black/20 backdrop-blur-sm` para efeito translucido
- Listas com `w-72 shrink-0` para largura fixa e `max-h-full` com scroll interno
- Area kanban usa `overflow-x-auto overflow-y-hidden` para scroll horizontal
- Cards usam `bg-white rounded-lg shadow-sm` com `hover:bg-gray-50`
- Botao "Adicionar outra lista" com `bg-white/20 hover:bg-white/30` (fantasma)
- Dados mockados: 3 listas ("Hoje", "Esta semana", "Mais tarde") com 9 cards totais
- Nenhuma interacao de drag-and-drop nesta etapa (apenas visual)

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

### Como testar (PROCEDIMENTO OBRIGATORIO COM PAUSA):
1. **ABRIR O NAVEGADOR NA PRODUCAO:** Abrir a pagina de login: `https://task-vision-production.up.railway.app/login` (PROIBIDO usar localhost)
2. **PAUSAR A EXECUCAO:** Enviar mensagem ao usuario: "Por favor, faca o login manualmente no navegador usando as credenciais de admin. Me avise aqui no chat quando terminar."
3. **AGUARDAR O SINAL VERDE:** E PROIBIDO executar qualquer outra acao antes que o usuario responda explicitamente com algo como "ok", "feito" ou "pode continuar"
4. **RETOMAR O TESTE:** Apenas apos a confirmacao do usuario, prosseguir com a navegacao para testar a pagina ou funcionalidade solicitada
5. Capturar screenshot se relevante
6. Reportar o resultado ao usuario

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

---

## 2026-04-09 — Fase 3, Etapa 2: Refinamento Visual do Board (Kanban Trello-like)

### Status anterior
- Interface do board ja existia com layout basico funcional (criada na conversa anterior)
- Listas horizontais, cards empilhados, fundo gradiente — estrutura correta
- Board header tinha breadcrumb desnecessario

### Mudancas Aplicadas

#### `components/board/board-header.tsx`
- **Removido** breadcrumb (link para workspace + chevron icon)
- **Removidos** props `workspaceId` e `workspaceName` — agora so recebe `title`
- Header agora mostra apenas o titulo do board em branco/negrito sobre fundo translucido

#### `components/board/kanban-card.tsx`
- **Adicionado** `active:scale-[0.98]` — micro-animacao de press para feedback tatil
- **Adicionado** `hover:shadow-md` — sombra mais forte no hover para profundidade
- **Trocado** `transition-colors` por `transition-all duration-150` para animar tudo
- **Adicionado** `select-none` no texto para evitar selecao acidental ao arrastar
- **Adicionado** `py-2.5` (antes era `py-2`) para padding vertical mais confortavel
- **Ajustada** borda de `border-gray-200` para `border-gray-200/80` (mais sutil)

#### `components/board/kanban-list.tsx`
- **Trocado** `rounded-xl` por `rounded-2xl` nas listas (bordas mais arredondadas)
- **Adicionado** `cursor-pointer` nos botoes de opcoes e adicionar cartao

#### `app/(dashboard)/boards/[id]/page.tsx`
- **Simplificado** uso do `BoardHeader` — removidos props `workspaceId` e `workspaceName`
- **Trocado** `rounded-xl` por `rounded-2xl` no botao "Adicionar outra lista"
- **Adicionado** `transition-all duration-200` e `active:scale-[0.97]` no botao fantasma

### Arquivos Modificados:
- `components/board/board-header.tsx`
- `components/board/kanban-card.tsx`
- `components/board/kanban-list.tsx`
- `app/(dashboard)/boards/[id]/page.tsx`
- `claude.md` — atualizado regra de teste via navegador (pausa obrigatoria para login manual) e log desta etapa

---

## 2026-04-09 — Fase 4: Board Funcional (CRUD de Listas, Cards, Modal de Detalhe)

### Status anterior
- Board existia apenas com dados mockados (falsos) — nao conectava ao banco
- Nao era possivel criar cartao, acessar cartao ou criar lista — tudo era visual estatico
- Pagina do workspace nao tinha link de navegacao para boards reais
- Nao existia botao para criar boards dentro de um workspace

### Problemas Reportados pelo Usuario
1. **Nao consigo criar cartao** — Botoes "Adicionar um cartao" nao tinham funcionalidade
2. **Nao consigo acessar um cartao** — Clicar nos cards nao abria nenhum detalhe
3. **Nao consigo criar uma nova lista** — Botao "Adicionar outra lista" nao funcionava

### Causa Raiz
- **Nao existiam API routes** para boards, lists ou cards — so existiam para auth, users e workspaces
- A pagina do board usava **dados mockados** (constante MOCK_LISTS) em vez de consultar o banco
- Os botoes eram puramente visuais sem onClick handlers conectados a APIs
- Os cards do workspace nao eram links clicaveis para os boards

### Correcoes e Novas Funcionalidades

#### API Routes Criadas (5 arquivos novos)
- `app/api/boards/route.ts` — POST criar board (valida workspace membership)
- `app/api/boards/[id]/route.ts` — GET board com listas e cards (verifica acesso)
- `app/api/lists/route.ts` — POST criar lista (posicao automatica no final)
- `app/api/cards/route.ts` — POST criar card (posicao automatica no final)
- `app/api/cards/[id]/route.ts` — GET detalhe + PATCH atualizar + DELETE excluir card

#### Componentes Criados (2 arquivos novos)
- `components/board/board-client.tsx` — componente client principal do board:
  - Gerencia estado de listas e cards com useState
  - Funcao handleCreateList() — chama POST /api/lists
  - Funcao handleCreateCard() — chama POST /api/cards
  - Funcao handleCardClick() — abre modal do card
  - Funcao handleCardUpdate() — atualiza card no estado apos PATCH
  - Funcao handleCardDelete() — remove card do estado apos DELETE
  - Input inline para criar lista com fundo branco e botao "Adicionar lista"
  - Renderiza CardDetailModal quando um card e selecionado

- `components/board/card-detail-modal.tsx` — modal de detalhe do card (inspirado no print do usuario):
  - Layout 2 colunas: conteudo principal (esquerda) + atividade (direita)
  - Barra de topo com nome da lista atual + icones (capa, acompanhar, opcoes, fechar)
  - Titulo editavel inline (clica pra editar, Enter pra salvar, Esc pra cancelar)
  - Botoes de acao: Adicionar, Etiquetas, Checklist, Anexo
  - Secao Membros com avatar (iniciais do usuario) e botao + para adicionar
  - Data de Entrega com badge "Em Atraso" se criado ha mais de 24h
  - Descricao editavel com textarea expandivel e botoes Salvar/Cancelar
  - Comentarios e atividade: campo de input + feed com acao "adicionou este cartao a [lista]"
  - Botao "Mostrar Detalhes" expande secao com data criacao, ultima atualizacao, lista, e botao excluir
  - Overlay escuro com backdrop-blur, fecha ao clicar fora ou pressionar ESC
  - z-50 e position fixed para funcionar acima de qualquer layout

- `components/create-board-modal.tsx` — modal para criar board dentro de um workspace:
  - Dialog com input de titulo
  - POST /api/boards e navega para /boards/[id] apos criar
  - Estilo dark theme consistente com CreateWorkspaceModal

#### Arquivos Modificados (4 arquivos)
- `app/(dashboard)/boards/[id]/page.tsx` — **reescrito completamente**:
  - Removido MOCK_LISTS e todos os dados falsos
  - Agora busca board real do banco com Prisma (include lists + cards)
  - Verifica autenticacao e membership do workspace
  - Serializa datas para JSON (Server Component → Client Component)
  - Renderiza BoardClient em vez de renderizar listas diretamente

- `components/board/kanban-list.tsx` — **reescrito**:
  - Interface CardData agora tem todos os campos (description, position, listId, createdAt, updatedAt)
  - Props adicionadas: onCreateCard (callback) e onCardClick (callback)
  - Input inline para criar card com textarea (multiline, Enter submete)
  - Botao alterna entre "Adicionar um cartao" e o formulario inline
  - Indicador visual de descricao nos cards (icone de linhas horizontais)

- `components/board/kanban-card.tsx` — atualizado:
  - Prop onClick adicionada para abrir o modal
  - Prop hasDescription adicionada para mostrar icone indicador
  - Icone de descricao (3 linhas horizontais) aparece quando card tem descricao

- `app/(dashboard)/workspaces/[id]/page.tsx` — atualizado:
  - Board cards agora sao `<Link>` clicaveis (antes eram `<div>`)
  - Navega para `/boards/[boardId]` ao clicar
  - Adicionado `<CreateBoardModal>` com botao "+ Novo Board"
  - Import do CreateBoardModal e Link adicionados

### Decisoes Tecnicas
- Cards marcam posicao com incremento de 1000 (1000, 2000, 3000...) para facilitar reordenacao futura
- API de cards suporta mover card entre listas via PATCH (campo listId)
- Modal usa position:fixed com z-50 para funcionar independente do overflow:hidden do layout do board
- Estado do board e gerenciado no client (useState) para atualizacoes instantaneas sem reload
- Todas as APIs verificam membership do workspace antes de permitir operacoes

### Verificacao
- `npm run build` — compilou sem erros
- Todas as novas rotas aparecem no build: /api/boards, /api/boards/[id], /api/lists, /api/cards, /api/cards/[id]
- Testado em producao: workspace mostra boards clicaveis, board busca dados reais do banco
- Testado: criar lista "A Fazer" funcionou
- Testado: criar card "Tarefa de teste" funcionou
- Testado via JavaScript: modal do card abre corretamente (confirmado via DOM query)

### Erros e Correcoes
| # | Erro | Causa | Correcao |
|---|------|-------|----------|
| 9 | PowerShell recusa `&&` no git commit | Sintaxe PS vs Bash | Rodei git add e git commit separados |

---

## Fase 5 — CardDetailModal Funcional (Etapas 1-4)
**Data:** 2026-04-09  
**Sessao:** Implementacao completa das acoes do CardDetailModal

### O que foi feito

#### Schema Prisma Expandido (7 novos models)
- `Label` — etiquetas coloridas por board
- `CardLabel` — pivot N:N card ↔ label
- `Checklist` — listas de verificacao
- `ChecklistItem` — itens individuais com status
- `Attachment` — anexos (links)
- `CardMember` — membros atribuidos ao card
- `Comment` — comentarios com autor
- `Activity` — historico de atividade (preparado)
- Card ganhou: `dueDate`, `isDueCompleted`, `creatorId`
- User ganhou relacoes: createdCards, cardMemberships, comments, activities, attachments
- Board ganhou relacao: labels

#### APIs Criadas
| Rota | Metodos | Descricao |
|------|---------|-----------|
| `/api/cards/[id]/comments` | GET, POST | Comentarios do card |
| `/api/cards/[id]/checklists` | GET, POST | Checklists do card |
| `/api/checklists/[id]` | PATCH, DELETE | Editar/excluir checklist |
| `/api/checklists/[id]/items` | POST | Criar item de checklist |
| `/api/checklist-items/[id]` | PATCH, DELETE | Toggle/excluir item |
| `/api/boards/[id]/labels` | GET, POST | Labels do board |
| `/api/cards/[id]/labels` | GET, POST, DELETE | Atribuir/remover labels |
| `/api/cards/[id]/members` | GET, POST, DELETE | Membros do card |
| `/api/cards/[id]/attachments` | GET, POST, DELETE | Anexos do card |
| `PATCH /api/cards/[id]` | atualizado | Aceita dueDate e isDueCompleted |

#### UI/UX Implementado
- **DueDate picker**: datetime-local com salvar/remover/cancelar
- **Toggle concluido**: checkbox que marca data como concluida (verde) ou em atraso (vermelho)
- **Comentarios reais**: carrega do banco, posta novo com Enter, mostra autor/timestamp
- **Checklists**: criar, deletar, adicionar items, toggle complete, progress bar animada
- **Labels**: picker de cores (8 cores), criar label no board, toggle assign/unassign, badges coloridos
- **KanbanCard**: badge colorido de DueDate no card face (verde/vermelho/amarelo)

### Verificacao
- `npx prisma db push` aplicado direto via URL publica do Railway
- Build passa sem erros TypeScript
- Testado em producao: DueDate salva, Comentario posta, modal abre corretamente
- Screenshot confirma: data "15 de abr., 14:00" e comentario "Teste de comentario automatico" visiveis

### Erros e Correcoes
| # | Erro | Causa | Correcao |
|---|------|-------|----------|
| 10 | `prisma db push` no build falha | Railway build isola rede — nao acessa `postgres.railway.internal` | Removido do build script, aplicado via CLI com URL publica |
| 11 | Type error: dueDate Date vs string | Server Component retorna Date, Client espera string | Serializado dueDate com `.toISOString()` na page.tsx |

---

## 2026-04-11 — Fase 6: Sistema de Notificacoes

### Referencia
- Estudamos o Planka original ([plankanban/planka](https://github.com/plankanban/planka)) — modelos `Notification.js`, `Action.js`, `CardSubscription.js`, `NotificationService.js`
- Planka tem 4 tipos de notificacao interna: moveCard, commentCard, addMemberToCard, mentionInComment
- Planka NAO tem notificacoes de due date (feature request aberto)
- Task Vision implementa 5 tipos incluindo DUE_DATE_SOON e DUE_DATE_OVERDUE como diferencial
- Traduzimos a logica de Sails.js/Waterline para Next.js 16 + Prisma 7 + PostgreSQL

### Plano de Execucao
| Passo | Descricao | Status |
|-------|-----------|--------|
| 1 | Atualizar schema Prisma (enum + model Notification + relacoes) | Feito |
| 2 | Aplicar schema no banco de producao Railway | Feito |
| 3 | Criar helper centralizado de notificacoes | Feito |
| 4 | Criar APIs de notificacao (GET, PATCH, count) | Feito |
| 5 | Modificar APIs existentes para disparar notificacoes | Feito |
| 6 | Criar componente NotificationBell | Feito |
| 7 | Integrar sino no dashboard-nav | Feito |
| 8 | Build + lint + commit + push | Feito |
| 9 | Teste visual em producao | Feito |

### Mudancas no Schema Prisma

#### Novo enum: `NotificationType`
- `COMMENT_ADDED` — alguem comentou num card onde o user e membro
- `MEMBER_ADDED` — user foi adicionado como membro de um card
- `DUE_DATE_SOON` — card com due date proximo (24h ou menos)
- `DUE_DATE_OVERDUE` — card com due date vencido
- `CARD_MOVED` — card foi movido de lista

#### Novo model: `Notification`
- `id` (cuid), `userId`, `creatorId?`, `cardId`, `boardId`, `commentId?`
- `type` (NotificationType), `data` (Json), `isRead` (Boolean, default false)
- `createdAt`, `updatedAt`
- Relacoes: user (receiver), creator, card, board, comment
- Indices: [userId, isRead], [userId, createdAt], [cardId]
- onDelete Cascade em user, card, board, comment

#### Relacoes adicionadas aos models existentes
- `User`: receivedNotifications, createdNotifications
- `Card`: notifications
- `Board`: notifications
- `Comment`: notifications

### Schema aplicado no banco
- Comando: `prisma db push` via URL publica do Railway (ballast.proxy.rlwy.net)
- Para obter URL publica: `railway service Postgres` → `railway variables --json` → `DATABASE_PUBLIC_URL`
- Resultado: schema sincronizado em 6.33s

### Arquivos Criados (5 novos)
- `lib/notifications/create-notification.ts` — helper centralizado com 2 funcoes:
  - `createNotification()` — cria 1 notificacao (ex: membro adicionado)
  - `notifyCardMembers()` — cria notificacoes em batch para todos os membros do card (ex: comentario)
  - Ambas ignoram silenciosamente o autor da acao (nunca se auto-notifica)
  - Ambas capturam erros silenciosamente (notificacao nunca quebra a acao principal)

- `app/api/notifications/route.ts` — API de notificacoes:
  - GET: listar notificacoes do user logado (paginacao cursor-based, filtro unreadOnly, limit)
  - PATCH: marcar como lida(s) — aceita `ids: [...]` ou `markAllRead: true`

- `app/api/notifications/count/route.ts` — GET contar nao-lidas (para badge do sino)

- `components/notification-bell.tsx` — componente do sino:
  - Polling a cada 30s via setInterval + fetch /api/notifications/count
  - Badge vermelho com contagem (max "99+")
  - Dropdown (DropdownMenu shadcn) com lista scrollavel (max 400px)
  - Icones por tipo: 💬 comentario, 👤 membro, 📅 due date, 🔄 movido
  - Texto descritivo com nome do criador + titulo do card
  - Notificacao nao-lida: bg-indigo-500/10 + borda esquerda indigo + bolinha azul
  - Notificacao lida: fundo transparente
  - Clicar: marca como lida + navega para o board
  - Botao "Marcar todas como lidas" no header
  - Empty state: "Nenhuma notificacao 🎉"

### Arquivos Modificados (4 arquivos)

#### `app/api/cards/[id]/comments/route.ts`
- Adicionado import de `notifyCardMembers`
- Apos criar comentario: dispara `COMMENT_ADDED` para membros do card (exceto autor)
- Board select ajustado para incluir `id: true` (necessario para boardId na notificacao)

#### `app/api/cards/[id]/members/route.ts`
- Adicionado import de `createNotification`
- Apos adicionar membro: dispara `MEMBER_ADDED` para o user adicionado
- Board select ajustado para incluir `id: true`

#### `app/api/cards/[id]/route.ts` (PATCH)
- Adicionado import de `notifyCardMembers`
- Quando `listId` muda: dispara `CARD_MOVED` com fromList/toList
- Quando `dueDate` e definido/alterado: dispara `DUE_DATE_SOON`
- List query ajustada para select com `id`, `title`, `board.id`, `board.workspaceId`

#### `components/dashboard-nav.tsx`
- Adicionado import de `NotificationBell`
- Sino inserido entre link admin e avatar do usuario

### Decisoes Tecnicas
- **Polling (30s)**: setInterval no client, sem WebSocket/SSE nesta fase
- **Notificacoes fire-and-forget**: chamadas sem `await` nas APIs (nao bloqueia resposta)
- **Self-notification prevention**: helper nunca notifica o autor da acao
- **Cascade deletes**: deletar card/board/user remove notificacoes automaticamente
- **Desnormalizacao**: boardId salvo direto na notificacao para queries rapidas (sem joins)
- **Due date**: notificacao criada apenas no momento da definicao/alteracao (sem cron)

### Erros e Correcoes
| # | Erro | Causa | Correcao |
|---|------|-------|----------|
| 12 | `prisma db push` falha localmente | URL local (localhost:51213) aponta para proxy Prisma Accelerate nao rodando | Obtido URL publica do Railway via `railway variables --json` no servico Postgres |
| 13 | Type error: `Record<string, unknown>` incompativel com Json do Prisma 7 | Prisma 7 usa `runtime.InputJsonValue` mais restritivo | Tipado como `Record<string, string>` + cast `as object` no prisma.create |