## Binance Manager

Painel pessoal de trades da Binance com Next.js 15 (App Router), TypeScript, Tailwind, Prisma e Supabase.

### Stack
- Next.js 15 + App Router + TypeScript
- Tailwind CSS v4
- Prisma ORM (`@prisma/client`, `prisma`)
- Banco: Supabase (Postgres). Variáveis no `.env`: `DATABASE_URL`
- Bibliotecas: `@supabase/supabase-js`, `axios`, `zod`, `date-fns`, `jsonwebtoken`, `crypto`, `papaparse`, `pdfkit`, `recharts`, `react-hook-form`, `@tanstack/react-table`

### Configuração
1. Crie `.env` com:
```
DATABASE_URL=postgresql://...
```
2. Instale dependências e gere o client do Prisma:
```bash
npm install
npx prisma migrate dev --name init
npx prisma studio
```
3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### Endpoints
- `GET /api/trades?month=YYYY-MM&market?&symbol?&page?&pageSize?` → lista trades e resumo mensal
- `GET /api/export/csv` → CSV filtrado (mesmos parâmetros)
- `GET /api/export/pdf` → PDF mensal (resumo)
- `POST /api/jobs/sync-all` → dispara sincronização (stub)
- `GET/POST /api/accounts` → listar/criar contas (armazenamento temporário Base64)

### UI
- `/dashboard`: KPIs (PnL, ROI aprox., taxas, trades) e gráfico de PnL diário
- `/trades`: tabela com filtros (mês/market/symbol), paginação e export CSV/PDF
- `/accounts`: formulário (name/market/apiKey/apiSecret) e listagem, botão "Sincronizar agora"

### Segurança
- Não expor chaves Binance no cliente. Hoje Base64 é temporário; substituir por criptografia forte (libsodium/secretbox) com nonce + ciphertext e chave fora do banco (env/KMS).

### Próximos passos
- Integração real com Binance (assinatura HMAC‑SHA256, paginação, idempotência por tradeId/orderId)
- Trocar Base64 por libsodium
- Configurar Vercel Cron chamando `POST /api/jobs/sync-all` (ex: `0 */6 * * *`)

### Scripts
- `npm run db:migrate` → `prisma migrate dev`
- `npm run db:studio` → `prisma studio`
