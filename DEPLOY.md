# 🚀 Deploy na Vercel - Binance Manager

## Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Repositório GitHub conectado

## Passo 1: Configurar Supabase

### 1.1 Criar projeto Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.2 Executar migrations
```bash
# No terminal local
npm run db:deploy
# ou
npx prisma migrate deploy
```

## Passo 2: Deploy na Vercel

### 2.1 Conectar repositório
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe o repositório `binance-manager`
4. Configure como projeto Next.js

### 2.2 Configurar variáveis de ambiente
Na dashboard da Vercel, vá em Settings → Environment Variables:

```
DATABASE_URL = postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL = https://[PROJETO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [ANON_KEY]
```

### 2.3 Deploy
- A Vercel fará o deploy automaticamente
- Ou execute: `npm run deploy:vercel`

## Passo 3: Configurar Cron Jobs

### 3.1 Verificar vercel.json
O arquivo `vercel.json` já está configurado para:
- Sincronização automática a cada 6 horas
- Runtime Node.js para PDF generation

### 3.2 Testar cron job
```bash
# Testar endpoint localmente
curl -X POST https://[SEU_DOMINIO].vercel.app/api/jobs/sync-all
```

## Passo 4: Configurações de segurança

### 4.1 Políticas Supabase
Configure as políticas de segurança no Supabase:
```sql
-- Permitir leitura/escrita apenas para usuários autenticados
CREATE POLICY "Enable read access for authenticated users" ON trades
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON trades
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### 4.2 Variáveis de segurança
Adicione na Vercel:
```
NEXTAUTH_SECRET = [GERAR_CHAVE_FORTE]
VERCEL_CRON_SECRET = [GERAR_CHAVE_FORTE]
```

## Comandos úteis

```bash
# Deploy manual
npm run deploy:vercel

# Ver logs da Vercel
vercel logs

# Executar migrations em produção
npx prisma migrate deploy

# Gerar cliente Prisma
npm run db:generate
```

## Troubleshooting

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correto
- Confirme se o projeto Supabase está ativo
- Teste a conexão: `npx prisma db pull`

### Erro de build
- Verifique se todas as dependências estão no `package.json`
- Confirme se `next.config.ts` está configurado corretamente
- Teste build local: `npm run build`

### Cron job não executa
- Verifique se `vercel.json` está na raiz do projeto
- Confirme se o endpoint `/api/jobs/sync-all` retorna 200
- Verifique logs na dashboard da Vercel

## Próximos passos

1. ✅ Deploy na Vercel
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar cron jobs
4. 🔄 Implementar autenticação
5. 🔄 Integrar Binance API real
6. 🔄 Implementar criptografia libsodium
7. 🔄 Adicionar notificações
8. 🔄 Implementar cache Redis
