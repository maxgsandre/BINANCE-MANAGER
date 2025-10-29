# Deploy Notes

## Configurar variáveis de ambiente na Vercel

### Produção

1. Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables
2. Adicione as seguintes variáveis para o ambiente **Production**:

```
BINANCE_API_KEY=sua_api_key_aqui
BINANCE_API_SECRET=sua_api_secret_aqui
```

### Preview (opcional)

Se quiser testar em Preview Deployments, adicione também para o ambiente **Preview**.

### Importante

⚠️ **NÃO** use o prefixo `NEXT_PUBLIC_` para essas variáveis, pois elas contêm secrets e devem ser usadas apenas no servidor.

## Após adicionar as variáveis

1. Vá em **Deployments**
2. Clique em **"Redeploy"** no último deployment
3. Isso faz o novo código usar as variáveis de ambiente configuradas

## Verificar se funcionou

1. Vá em **Functions → /api/balance**
2. Clique em **View Function Logs**
3. Procure por: `BALANCE_API_START` e `hasKey: true`
4. Se aparecer algum erro `BINANCE_ERROR`, leia a mensagem de erro

## Troubleshooting

### Erro `Missing env: BINANCE_API_KEY`

- As variáveis não foram configuradas na Vercel
- Resolve: adicionar as variáveis e fazer redeploy

### Erro `-1021` (timestamp out of sync)

- O servidor local está com relógio descompassado
- Resolve: já ajustei `recvWindow` para 10000ms, se ainda falhar, verifique o relógio do sistema

### Erro `401` ou `403`

- API key sem permissão de leitura
- IP não está na whitelist da Binance
- Resolve: conferir permissões da API key na Binance e whitelist de IP

## Configuração da API Key na Binance

1. Acesse: https://www.binance.com/en/my/settings/api-management
2. Crie uma API Key ou use uma existente
3. Em **"IP access restrictions"**:
   - Escolha **"Unrestricted"** para desenvolvimento
   - Ou adicione seu IP específico e o IP de cada máquina que for usar
4. Em **"API restrictions"**, habilite:
   - ✅ **Enable Reading**

## Próximos passos

- Adicionar cache de balance (opcional)
- Adicionar refresh manual via UI
- Implementar polling automático (opcional)

