import { prisma } from './prisma';

/**
 * Calcula o saldo (caixa) até uma data específica
 * Baseado nos trades anteriores
 */
export async function getCashflowAtDate(
  accountId: string,
  date: Date
): Promise<{ asset: string; free: string; locked: string }[]> {
  // Buscar todos os trades até a data especificada
  const trades = await prisma.trade.findMany({
    where: {
      accountId,
      executedAt: { lte: date }
    },
    orderBy: { executedAt: 'asc' }
  });

  // Calcular saldo acumulado por asset
  const balance = new Map<string, { free: number; locked: number }>();

  for (const trade of trades) {
    // Determinar qual asset recebe/entrega baseado no símbolo e side
    const baseAsset = trade.symbol.replace('BRL', '').replace('USDT', '');
    const quoteAsset = trade.symbol.includes('BRL') ? 'BRL' : 'USDT';

    const qty = Number(trade.qty);
    const price = Number(trade.price);
    const feeValue = Number(trade.feeValue);

    if (trade.side === 'BUY') {
      // Compra: recebe base asset, entrega quote asset
      balance.set(baseAsset, {
        free: (balance.get(baseAsset)?.free || 0) + qty,
        locked: (balance.get(baseAsset)?.locked || 0)
      });

      balance.set(quoteAsset, {
        free: (balance.get(quoteAsset)?.free || 0) - (qty * price),
        locked: (balance.get(quoteAsset)?.locked || 0)
      });

      // Deduzir fee
      if (trade.feeAsset === baseAsset) {
        balance.set(baseAsset, {
          free: (balance.get(baseAsset)?.free || 0) - feeValue,
          locked: (balance.get(baseAsset)?.locked || 0)
        });
      } else {
        balance.set(quoteAsset, {
          free: (balance.get(quoteAsset)?.free || 0) - feeValue,
          locked: (balance.get(quoteAsset)?.locked || 0)
        });
      }
    } else if (trade.side === 'SELL') {
      // Venda: entrega base asset, recebe quote asset
      balance.set(baseAsset, {
        free: (balance.get(baseAsset)?.free || 0) - qty,
        locked: (balance.get(baseAsset)?.locked || 0)
      });

      balance.set(quoteAsset, {
        free: (balance.get(quoteAsset)?.free || 0) + (qty * price),
        locked: (balance.get(quoteAsset)?.locked || 0)
      });

      // Deduzir fee
      if (trade.feeAsset === baseAsset) {
        balance.set(baseAsset, {
          free: (balance.get(baseAsset)?.free || 0) - feeValue,
          locked: (balance.get(baseAsset)?.locked || 0)
        });
      } else {
        balance.set(quoteAsset, {
          free: (balance.get(quoteAsset)?.free || 0) - feeValue,
          locked: (balance.get(quoteAsset)?.locked || 0)
        });
      }
    }
  }

  // Converter para array no formato da Binance
  const result: { asset: string; free: string; locked: string }[] = [];
  for (const [asset, bal] of balance.entries()) {
    // Só incluir se o saldo não for zero
    if (bal.free !== 0 || bal.locked !== 0) {
      result.push({
        asset,
        free: bal.free.toString(),
        locked: bal.locked.toString()
      });
    }
  }

  return result;
}

