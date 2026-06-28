# DBGuard — Especificação Completa do Projeto

> SaaS de backup automático de banco de dados para devs e agências brasileiras.
> Este documento é o briefing completo para implementação via Claude Code.

---

## Visão do Produto

**O que é:** Serviço que faz backup automático de bancos MySQL/PostgreSQL todo dia, criptografa e armazena no Backblaze B2. O cliente recebe confirmação por email. Se falhar, alerta imediato.

**Público-alvo:** Devs freelancers e agências que hospedam sistemas de clientes em VPS.

**Proposta de valor:** "Você configura uma vez. A gente cuida do resto. Se perder dados, a culpa nunca é falta de backup."

**Modelo de negócio:**
- Starter: 1 banco, 7 dias de retenção → R$29/mês
- Pro: 5 bancos, 30 dias → R$79/mês
- Business: bancos ilimitados, 90 dias → R$199/mês

---

## Stack Técnica

### Backend
- **Runtime:** Node.js 20+ com TypeScript
- **Framework:** Fastify (mais rápido que Express, melhor DX)
- **ORM:** Prisma com PostgreSQL
- **Autenticação:** JWT + refresh tokens (httpOnly cookies)
- **Jobs:** node-cron para agendamento de backups
- **Email:** Resend (API simples, boa entrega)
- **Storage:** Backblaze B2 SDK
- **Criptografia:** Node.js crypto nativo (AES-256-GCM)
- **Validação:** Zod
- **Logs:** Pino

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (sem component library — design custom)
- **State:** Zustand para estado global, React Query para server state
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **HTTP:** Axios com interceptors

### Infraestrutura (VPS Hostinger Ubuntu 24.04)
- **Process manager:** PM2
- **Reverse proxy:** Nginx
- **SSL:** Certbot (Let's Encrypt)
- **DB:** PostgreSQL 16

### Agente (roda no servidor do cliente)
- Pacote npm publicável: `@dbguard/agent`
- Zero dependências pesadas
- Roda como serviço systemd ou com PM2

---

## Estrutura de Diretórios

```
dbguard/
├── apps/
│   ├── api/                    # Backend Fastify
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Login, registro, JWT
│   │   │   │   ├── databases/  # CRUD de bancos cadastrados
│   │   │   │   ├── backups/    # Histórico, download, restauração
│   │   │   │   ├── billing/    # Planos e assinatura (Stripe)
│   │   │   │   └── alerts/     # Config de notificações
│   │   │   ├── jobs/           # Cron jobs de backup
│   │   │   ├── lib/
│   │   │   │   ├── crypto.ts   # Criptografia AES-256-GCM
│   │   │   │   ├── b2.ts       # Client Backblaze B2
│   │   │   │   ├── email.ts    # Templates de email
│   │   │   │   └── dump.ts     # Execução de mysqldump/pg_dump
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts     # Verificação JWT
│   │   │   │   ├── rateLimit.ts
│   │   │   │   └── validate.ts
│   │   │   └── app.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   ├── web/                    # Frontend React
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Landing.tsx
│   │       │   ├── Login.tsx
│   │       │   ├── Register.tsx
│   │       │   ├── Dashboard.tsx
│   │       │   ├── Databases.tsx
│   │       │   ├── Backups.tsx
│   │       │   └── Settings.tsx
│   │       ├── components/
│   │       │   ├── ui/         # Componentes base do design system
│   │       │   └── layout/
│   │       └── lib/
│   │
│   └── agent/                  # Pacote npm do agente
│       └── src/
│           ├── index.ts        # CLI de setup
│           ├── runner.ts       # Executa o backup
│           └── config.ts       # Lê configuração local
│
└── packages/
    └── shared/                 # Types e validações compartilhadas
        └── src/
            └── schemas.ts
```

---

## Schema do Banco de Dados (Prisma)

```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  name          String
  plan          Plan       @default(STARTER)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  databases     Database[]
  apiTokens     ApiToken[]
}

model Database {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String                    // Nome amigável: "Banco do Cliente X"
  type          DatabaseType              // MYSQL | POSTGRES
  host          String                    // Armazenado criptografado
  port          Int
  dbName        String
  username      String                    // Armazenado criptografado
  passwordEnc   String                    // AES-256-GCM criptografado
  
  schedule      String     @default("0 2 * * *")  // Cron expression
  retention     Int        @default(7)             // Dias de retenção
  isActive      Boolean    @default(true)
  lastBackupAt  DateTime?
  lastStatus    BackupStatus?

  createdAt     DateTime   @default(now())
  backups       Backup[]
}

model Backup {
  id            String       @id @default(cuid())
  databaseId    String
  database      Database     @relation(fields: [databaseId], references: [id], onDelete: Cascade)

  status        BackupStatus
  sizeBytes     BigInt?
  b2FileId      String?       // ID do arquivo no Backblaze B2
  b2FilePath    String?       // Caminho no bucket
  encKeyHash    String?       // Hash da chave para verificação

  startedAt     DateTime     @default(now())
  finishedAt    DateTime?
  errorMessage  String?
  
  checksumSha256 String?     // Checksum para verificação de integridade
}

model ApiToken {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  databaseId    String?    // Se nulo, token global da conta

  token         String     @unique  // Hash do token, não o token em si
  label         String              // "Servidor do cliente João"
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  createdAt     DateTime   @default(now())
}

enum DatabaseType {
  MYSQL
  POSTGRES
}

enum BackupStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}

enum Plan {
  STARTER
  PRO
  BUSINESS
}
```

---

## Módulos de Implementação

### 1. Autenticação (`apps/api/src/modules/auth/`)

**Segurança obrigatória:**
- Senhas: bcrypt com custo 12
- JWT access token: 15 minutos de expiração
- JWT refresh token: 30 dias, armazenado em httpOnly cookie
- Rate limiting: 5 tentativas de login por IP a cada 15 minutos
- Credenciais do banco criptografadas com AES-256-GCM antes de salvar no banco

**Endpoints:**
```
POST /auth/register    → { email, password, name }
POST /auth/login       → { email, password }
POST /auth/refresh     → (cookie) → novo access token
POST /auth/logout      → invalida refresh token
GET  /auth/me          → dados do usuário logado
```

**Fluxo de tokens:**
```typescript
// Access token no Authorization header
// Refresh token em httpOnly cookie 'dbguard_refresh'
// No frontend, Axios interceptor renova o access token automaticamente
```

---

### 2. Gerenciamento de Bancos (`apps/api/src/modules/databases/`)

**Segurança crítica — credenciais:**
```typescript
// lib/crypto.ts
// NUNCA armazenar credenciais em texto puro
// Usar chave derivada do ENCRYPTION_SECRET do .env + salt por registro

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16)
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes hex
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  }
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

**Endpoints:**
```
GET    /databases           → lista bancos do usuário
POST   /databases           → cadastra novo banco
GET    /databases/:id       → detalhes (sem senha)
PUT    /databases/:id       → atualiza configuração
DELETE /databases/:id       → remove banco e backups
POST   /databases/:id/test  → testa conexão (nunca retorna a senha)
POST   /databases/:id/token → gera token de agente
```

**Validação de conexão (endpoint /test):**
```typescript
// Tenta conectar no banco antes de salvar
// Se falhar, retorna erro descritivo em português
// Timeout de 10 segundos
// NUNCA expõe a senha no response ou nos logs
```

---

### 3. Engine de Backup (`apps/api/src/jobs/` e `lib/dump.ts`)

**Fluxo completo de um backup:**

```typescript
// jobs/backupRunner.ts

async function runBackup(database: Database): Promise<void> {
  const backup = await createBackupRecord(database.id) // status: RUNNING
  
  try {
    // 1. Descriptografar credenciais apenas em memória
    const credentials = decryptCredentials(database)
    
    // 2. Executar dump para arquivo temporário
    const tmpPath = `/tmp/dbguard_${backup.id}.sql`
    await executeDump(database.type, credentials, tmpPath)
    
    // 3. Comprimir com gzip
    await compress(tmpPath) // gera .sql.gz, apaga .sql
    
    // 4. Criptografar com chave única por backup
    const backupKey = randomBytes(32)
    await encryptFile(`${tmpPath}.gz`, `${tmpPath}.enc`, backupKey)
    
    // 5. Calcular checksum do arquivo criptografado
    const checksum = await sha256file(`${tmpPath}.enc`)
    
    // 6. Upload para Backblaze B2
    const { fileId, filePath } = await uploadToB2(`${tmpPath}.enc`, backup.id)
    
    // 7. Salvar chave de descriptografia criptografada no banco
    // (criptografada com a MASTER_KEY do sistema)
    const encKey = encryptKey(backupKey)
    
    // 8. Atualizar registro como sucesso
    await markSuccess(backup.id, { fileId, filePath, checksum, encKey, size })
    
    // 9. Limpar arquivos temporários
    await cleanup([tmpPath, `${tmpPath}.gz`, `${tmpPath}.enc`])
    
    // 10. Enviar email de confirmação
    await sendBackupSuccessEmail(database.user.email, database.name, size)
    
  } catch (error) {
    await markFailed(backup.id, error.message)
    await cleanup() // garantir limpeza mesmo com erro
    await sendBackupFailedAlert(database.user.email, database.name, error.message)
  }
}
```

**Execução do dump:**
```typescript
// lib/dump.ts

async function executeDump(
  type: DatabaseType,
  creds: DecryptedCredentials,
  outputPath: string
): Promise<void> {
  const timeout = 5 * 60 * 1000 // 5 minutos máximo
  
  if (type === 'MYSQL') {
    // IMPORTANTE: senha via variável de ambiente, nunca como argumento de linha
    // (argumentos ficam visíveis no ps aux)
    await execWithEnv(
      `mysqldump --single-transaction --quick --lock-tables=false \
       -h ${creds.host} -P ${creds.port} -u ${creds.username} ${creds.dbName} \
       > ${outputPath}`,
      { MYSQL_PWD: creds.password },
      timeout
    )
  }
  
  if (type === 'POSTGRES') {
    await execWithEnv(
      `pg_dump -h ${creds.host} -p ${creds.port} -U ${creds.username} \
       -d ${creds.dbName} -f ${outputPath} --no-password`,
      { PGPASSWORD: creds.password },
      timeout
    )
  }
}
```

**Agendador de cron:**
```typescript
// jobs/scheduler.ts
// Roda a cada minuto e verifica quais bancos precisam de backup
// Não usa um cron fixo por banco — usa um loop que checa o banco de dados
// Isso permite mudar horários sem reiniciar o servidor

cron.schedule('* * * * *', async () => {
  const due = await getDatabasesDue() // WHERE nextBackupAt <= NOW() AND isActive = true
  await Promise.allSettled(due.map(db => runBackup(db)))
})
```

---

### 4. Histórico e Download (`apps/api/src/modules/backups/`)

**Endpoints:**
```
GET  /backups                     → histórico paginado de todos os backups
GET  /backups?databaseId=:id      → backups de um banco específico
GET  /backups/:id/download        → URL assinada temporária para download (15 min)
POST /backups/:id/verify          → re-verifica integridade via checksum
```

**URL de download assinada:**
```typescript
// Nunca expor URL permanente do B2
// Gerar URL pré-assinada com expiração de 15 minutos
// Logar quem fez o download e quando
const signedUrl = await b2.getDownloadAuthorization({
  bucketId: process.env.B2_BUCKET_ID,
  fileNamePrefix: backup.b2FilePath,
  validDurationInSeconds: 900 // 15 minutos
})
```

---

### 5. Agente (`apps/agent/`)

**O que o cliente instala no servidor dele:**

```bash
npm install -g @dbguard/agent
dbguard-agent init --token <TOKEN_DA_API>
```

**O que o `init` faz:**
1. Valida o token com a API
2. Baixa a configuração do banco cadastrado
3. Cria `/etc/dbguard/config.json` (permissão 600)
4. Instala serviço systemd ou cria processo PM2
5. Executa backup de teste imediato para confirmar

**Runner do agente:**
```typescript
// agent/src/runner.ts
// Roda no servidor do cliente

async function run(): Promise<void> {
  const config = readConfig() // /etc/dbguard/config.json
  
  // 1. Criar dump local
  const tmpPath = await createDump(config)
  
  // 2. Comprimir
  await gzip(tmpPath)
  
  // 3. Enviar para a API do DBGuard via HTTPS com o token de autenticação
  // A API cuida da criptografia e do upload pro B2
  await uploadToApi(`${tmpPath}.gz`, config.token)
  
  // 4. Limpar temporário
  await fs.unlink(`${tmpPath}.gz`)
}
```

**Alternativa sem agente (para MVP):**
- O agente pode ser opcional no MVP
- A API pode conectar diretamente no banco do cliente se o IP da API estiver liberado no firewall do cliente
- Isso simplifica o MVP, mas o agente é mais seguro e escalável

---

### 6. Emails (`apps/api/src/lib/email.ts`)

**Templates necessários (em HTML, não plain text):**
- `backup-success`: "✓ Backup concluído — [nome do banco] — [tamanho] — [hora]"
- `backup-failed`: "⚠ Backup falhou — [nome do banco] — [motivo] — ação necessária"
- `welcome`: Boas-vindas + link para adicionar primeiro banco
- `verify-email`: Verificação de email no cadastro

**Tom dos emails:**
- Direto, sem enrolação
- Foco no que aconteceu e o que o usuário precisa saber
- Nunca use "Prezado(a)" ou linguagem corporativa
- Assunto do email deve ser informativo, não genérico

---

## Design System do Frontend

### Identidade Visual

**Conceito:** Produto técnico com seriedade — não startup colorida, não enterprise pesado.
O setor de backup é percebido como chato e técnico. DBGuard deve parecer confiável e moderno, como uma ferramenta que um dev sênior construiu para si mesmo.

**Paleta:**
```css
--color-bg:        #0A0B0E;   /* Quase preto — transmite solidez */
--color-surface:   #111318;   /* Cards e painéis */
--color-border:    #1E2028;   /* Bordas sutis */
--color-muted:     #2A2D38;   /* Hover states */

--color-text:      #F0F2F5;   /* Texto principal */
--color-secondary: #8B8FA8;   /* Texto secundário */
--color-hint:      #4A4E63;   /* Texto de apoio */

--color-accent:    #4F8EF7;   /* Azul principal — CTAs, links */
--color-success:   #34C97B;   /* Backup OK */
--color-warning:   #F5A623;   /* Atenção */
--color-danger:    #E5484D;   /* Erro, falha */

--color-accent-dim: rgba(79, 142, 247, 0.12); /* Background de badges */
```

**Tipografia:**
```css
/* Display (logo, headings grandes): Inter, peso 600-700 */
/* Body (interface): Inter, peso 400-500 */
/* Código e dados técnicos: JetBrains Mono */
/* Tamanho base: 14px com line-height 1.6 */
```

**Raio de borda:**
```css
--radius-sm: 6px;   /* Badges, chips */
--radius-md: 8px;   /* Inputs, botões */
--radius-lg: 12px;  /* Cards */
```

### Princípios de Interface

1. **Densidade informacional** — devs preferem ver mais informação na tela. Não use muito espaço em branco desnecessário.
2. **Status sempre visível** — o estado de cada banco e backup deve ser imediatamente legível.
3. **Ações destrutivas** sempre com confirmação. Nunca deletar sem "Tem certeza? Esta ação não pode ser desfeita."
4. **Feedback imediato** — toda ação deve ter loading state e resposta clara.
5. **Erros informativos** — nunca "Ocorreu um erro". Sempre o que foi e como resolver.

### Componentes do Design System

**Badge de status:**
```tsx
// Três estados: success (verde), failed (vermelho), pending (amarelo), running (azul pulsando)
<StatusBadge status="success" /> // → "● Concluído"
<StatusBadge status="failed" />  // → "● Falhou"
<StatusBadge status="running" /> // → "● Executando" (com animação de pulse)
```

**Botão principal:**
```css
/* Fundo sólido azul, sem gradiente, sem sombra */
/* Hover: levemente mais claro */
/* Loading state: spinner no lugar do texto */
/* Disabled: opacity 0.5, cursor not-allowed */
```

**Input:**
```css
/* Fundo ligeiramente mais claro que o surface */
/* Borda visível mas sutil */
/* Focus: borda azul, sem box-shadow de glow */
/* Error: borda vermelha + mensagem abaixo */
```

**Card:**
```css
/* Fundo surface, borda sutil */
/* Sem sombra — o contraste de cor já define o plano */
/* Hover em cards clicáveis: borda levemente mais clara */
```

---

## Páginas do Frontend

### Landing Page (`/`)

**Estrutura:**
```
[Header] Logo + Nav (Entrar / Começar grátis)

[Hero]
  Headline: "Backup automático para bancos de dados.
             Configurado uma vez. Funciona para sempre."
  Sub: "MySQL e PostgreSQL. Criptografado. Alertas em tempo real."
  CTA: "Começar 14 dias grátis" + "Ver como funciona ↓"

[Como funciona] — 3 passos simples
  1. Adicione seu banco → 2. Configuramos o backup → 3. Relaxe

[Prova] — números reais (quando tiver)
  "X backups feitos" / "Y GB protegidos" / "Z clientes ativos"

[Preços] — tabela limpa com os 3 planos

[Footer] — links legais + contato
```

**Regras de design da landing:**
- Zero animações de scroll desnecessárias
- Nenhuma imagem de banco de dados genérica do Unsplash
- Texto direto ao ponto — nenhuma frase de marketing vazia
- Mobile-first, funciona perfeitamente em celular

---

### Dashboard (`/dashboard`)

**Layout:**
```
[Sidebar] Logo + nav vertical
  - Visão geral
  - Meus bancos
  - Histórico
  - Configurações

[Conteúdo principal]
  [Header da página] "Visão geral" + botão "Adicionar banco"
  
  [Cards de resumo] (linha horizontal)
    - Total de bancos ativos
    - Backups hoje
    - Último backup (hora)
    - Espaço utilizado
  
  [Tabela de bancos]
    Colunas: Nome | Tipo | Último backup | Status | Próximo backup | Ações
    
  [Atividade recente]
    Lista dos últimos 10 backups com status
```

---

### Adicionar Banco (`/databases/new`)

**Formulário em etapas (não tudo de uma vez):**

```
Etapa 1: Informações de conexão
  - Nome amigável (ex: "Banco do cliente João")
  - Tipo: MySQL ou PostgreSQL
  - Host, Porta, Banco, Usuário, Senha
  - [Botão: Testar conexão]
  → Se passar: avança para etapa 2
  → Se falhar: mostra erro específico

Etapa 2: Configuração do backup
  - Horário do backup (select com opções pré-definidas)
  - Retenção (baseada no plano)
  - Notificações: email de sucesso (toggle) + email de falha (sempre ativo)

Etapa 3: Instalar agente (se necessário)
  - Mostra o comando de instalação com o token
  - Botão "Testar agora" que dispara backup imediato
  - Checklist do que foi configurado
```

---

### Histórico de Backups (`/backups`)

**Tabela com:**
- Filtro por banco (dropdown)
- Filtro por status (todos / sucesso / falha)
- Filtro por data (últimos 7 / 30 / 90 dias)
- Colunas: Banco | Data/hora | Status | Tamanho | Duração | Ações
- Ação de download: abre modal confirmando, gera link temporário
- Paginação: 25 por página

---

## Segurança — Checklist Completo

### Autenticação e Sessão
- [ ] Senhas com bcrypt custo 12
- [ ] JWT access token expira em 15 minutos
- [ ] Refresh token em httpOnly cookie (não acessível via JS)
- [ ] Verificação de email obrigatória antes de usar a conta
- [ ] Rate limiting em todas as rotas de auth (5 req/15min por IP)
- [ ] Logout invalida o refresh token no banco

### Dados e Credenciais
- [ ] Credenciais de banco criptografadas com AES-256-GCM no banco
- [ ] ENCRYPTION_KEY nunca no código — apenas em variável de ambiente
- [ ] Senha nunca aparece em logs, responses ou mensagens de erro
- [ ] Senha nunca é passada como argumento CLI (usar variável de ambiente)
- [ ] Tokens de API são hasheados antes de armazenar (guarda o hash, não o token)

### Comunicação
- [ ] HTTPS obrigatório em produção (HSTS)
- [ ] Headers de segurança: CSP, X-Frame-Options, X-Content-Type-Options
- [ ] CORS configurado apenas para o domínio do frontend
- [ ] Todos os inputs validados com Zod antes de processar

### Arquivos Temporários
- [ ] Dumps salvos em /tmp com nome aleatório (UUID)
- [ ] Limpeza garantida com try/finally — nunca deixar dump no disco
- [ ] Permissão 600 nos arquivos temporários
- [ ] Timeout de 5 minutos para execução do dump

### Backblaze B2
- [ ] Bucket privado (nunca público)
- [ ] URLs de download com expiração de 15 minutos
- [ ] Chaves de API do B2 com permissão mínima necessária
- [ ] Arquivo criptografado antes do upload (E2E encryption)

### API
- [ ] Autenticação obrigatória em todas as rotas exceto /auth/*
- [ ] Verificar que o recurso pertence ao usuário logado (row-level security)
- [ ] Rate limiting geral: 100 req/min por usuário
- [ ] Logs de auditoria para ações sensíveis (download, delete, token gerado)

---

## Variáveis de Ambiente

```env
# apps/api/.env

# Banco de dados
DATABASE_URL="postgresql://dbguard:senha@localhost:5432/dbguard_prod"

# JWT
JWT_SECRET="gere-com-openssl-rand-hex-64"
JWT_REFRESH_SECRET="outro-segredo-diferente"

# Criptografia de credenciais
ENCRYPTION_KEY="gere-com-openssl-rand-hex-32"

# Backblaze B2
B2_ACCOUNT_ID=""
B2_APPLICATION_KEY=""
B2_BUCKET_ID=""
B2_BUCKET_NAME=""

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM="DBGuard <backup@seudominio.com.br>"

# App
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://seudominio.com.br"
API_URL="https://api.seudominio.com.br"

# Opcional: Stripe para pagamentos
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

---

## Configuração do Servidor (VPS Hostinger)

### Nginx (`/etc/nginx/sites-available/dbguard`)
```nginx
# Frontend
server {
    listen 443 ssl;
    server_name seudominio.com.br;
    
    root /var/www/dbguard/web/dist;
    index index.html;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; ...";
    
    ssl_certificate /etc/letsencrypt/live/seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com.br/privkey.pem;
}

# API
server {
    listen 443 ssl;
    server_name api.seudominio.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    ssl_certificate /etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com.br/privkey.pem;
}
```

### PM2 (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'dbguard-api',
    script: 'dist/app.js',
    cwd: '/var/www/dbguard/apps/api',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/dbguard/error.log',
    out_file: '/var/log/dbguard/out.log',
    time: true,
  }]
}
```

---

## Ordem de Implementação (MVP)

### Fase 1 — Core (2 semanas)
1. Setup do monorepo (npm workspaces)
2. Schema Prisma + migrations
3. API: auth completo (register, login, refresh, logout)
4. API: CRUD de bancos com criptografia de credenciais
5. API: endpoint de teste de conexão
6. Engine de backup: dump + gzip + upload B2
7. Cron scheduler
8. Emails de sucesso e falha

### Fase 2 — Frontend (1 semana)
1. Design system: tokens, componentes base
2. Landing page
3. Autenticação (login/cadastro)
4. Dashboard com lista de bancos
5. Formulário de adicionar banco (com teste de conexão)
6. Histórico de backups com download

### Fase 3 — Agente e Polimento (1 semana)
1. Pacote npm do agente
2. Verificação de integridade (checksum)
3. Testes de restauração
4. Monitoramento de saúde da API
5. Documentação do agente

---

## Comandos para Iniciar

```bash
# Setup inicial
cd dbguard
npm install

# Banco de dados
cd apps/api
npx prisma migrate dev --name init
npx prisma generate

# Desenvolvimento
npm run dev          # Roda API e frontend em paralelo

# Build para produção
npm run build

# Gerar ENCRYPTION_KEY
openssl rand -hex 32

# Gerar JWT_SECRET
openssl rand -hex 64
```

---

## Notas Finais para o Claude Code

1. **Segurança não é opcional** — cada ponto do checklist de segurança deve ser implementado antes de considerar o módulo completo.

2. **Credenciais em texto puro = bug crítico** — se em algum momento uma senha aparecer em log, response ou erro, é bug de segurança que precisa ser corrigido imediatamente.

3. **Cleanup de arquivos temporários** — sempre use try/finally para garantir que dumps sejam deletados, mesmo em caso de erro.

4. **Testes de conexão antes de salvar** — nunca salve as credenciais de um banco sem antes verificar que a conexão funciona.

5. **O design não pode parecer gerado por IA** — use espaçamento consistente, tipografia deliberada, e evite padrões genéricos como gradientes de azul para roxo, cards com shadow pesada, ou ícones de banco de dados pixelados.

6. **Erros em português e informativos** — "Não foi possível conectar ao banco. Verifique se o host está acessível e se as credenciais estão corretas." é melhor que "Connection failed."

7. **Mobile funciona** — o dashboard precisa ser usável em celular, mesmo sendo produto B2B.
