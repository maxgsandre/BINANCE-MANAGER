import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBalance() {
  try {
    console.log('Verificando saldos no banco...\n');
    
    const balances = await prisma.monthlyBalance.findMany();
    
    console.log(`Total de registros: ${balances.length}\n`);
    
    if (balances.length > 0) {
      balances.forEach((balance, index) => {
        console.log(`${index + 1}. ID: ${balance.id}`);
        console.log(`   User ID: ${balance.userId}`);
        console.log(`   Mês: ${balance.month}`);
        console.log(`   Saldo Inicial: ${balance.initialBalance}`);
        console.log(`   Criado em: ${balance.createdAt.toISOString()}`);
        console.log(`   Atualizado em: ${balance.updatedAt.toISOString()}\n`);
      });
    } else {
      console.log('Nenhum saldo encontrado no banco de dados.');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBalance();

