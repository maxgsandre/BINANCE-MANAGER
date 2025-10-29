# Troubleshooting - Erro 451 Binance

## O Problema
A Binance retorna erro `451 - Service unavailable from a restricted location` quando a Vercel está em determinadas regiões.

## Por que acontece?
Não é questão de distância física, mas sim de:
- **Políticas de compliance** da Binance por região
- **Restrições regulatórias** locais
- **IPs específicos** em blacklist

## Soluções

### 1. Verificar configurações da API Key na Binance
1. Acesse: https://www.binance.com/en/my/settings/api-management
2. Abra sua API Key
3. **IMPORTANTE**: Desative "Restrict access to trusted IPs only" (ou adicione os IPs da Vercel)

### 2. Mudar região da Vercel
A região atual é `iad1` (Washington, EUA). Se não funcionar, tente outras:

**Opções de região:**
- `iad1` - Washington, EUA (atual)
- `sfo1` - São Francisco, EUA
- `fra1` - Frankfurt, Alemanha
- `cdg1` - Paris, França

**Como mudar:**
Edite `src/app/api/balance/route.ts` e `src/app/api/jobs/sync-all/route.ts`:
```typescript
export const preferredRegion = 'sfo1'; // ou outra região
```

### 3. Verificar se funciona localmente
Se funciona localmente mas não na Vercel, confirma que é bloqueio de IP da Vercel.

## Testar agora
1. Faça merge do PR para `main`
2. Aguarde deploy
3. Teste em: https://criptomanager.vercel.app/dashboard
4. Verifique se o erro 451 ainda aparece ou se o saldo carrega

