import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Aplicar migração
    const result = await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "BinanceAccount" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "apiKeyEnc" TEXT NOT NULL,
        "apiSecretEnc" TEXT NOT NULL,
        "market" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "BinanceAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Migration applied successfully',
      result 
    });
  } catch (error: unknown) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
