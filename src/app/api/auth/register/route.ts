import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    // Validações básicas
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Teste simples primeiro - apenas retornar sucesso
    return NextResponse.json({
      message: 'Teste de registro funcionando!',
      data: { name, email },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Erro ao criar usuário:', error);
    
    // Log detalhado para debug
    if (error instanceof Error) {
      console.error('Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Erro desconhecido') : 
          undefined
      },
      { status: 500 }
    );
  }
}
