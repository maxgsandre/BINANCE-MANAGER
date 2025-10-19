#!/bin/bash

# Script de setup para produção - Binance Manager
# Execute este script após fazer deploy na Vercel

echo "🚀 Configurando Binance Manager para produção..."

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🗄️ Gerando cliente Prisma..."
npx prisma generate

echo "🔧 Executando migrations no banco de produção..."
echo "⚠️ Certifique-se de que DATABASE_URL está configurado corretamente"
npx prisma migrate deploy

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente na Vercel"
echo "2. Teste o deploy: https://[SEU_DOMINIO].vercel.app"
echo "3. Teste o cron job: curl -X POST https://[SEU_DOMINIO].vercel.app/api/jobs/sync-all"
echo "4. Configure suas contas Binance na interface"
echo ""
echo "🔗 Links úteis:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Supabase Dashboard: https://supabase.com/dashboard"
echo "- Logs da Vercel: vercel logs"
