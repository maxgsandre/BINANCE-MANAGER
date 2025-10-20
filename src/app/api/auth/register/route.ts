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

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Criar usuário (sem senha ainda)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        isVerified: false,
        verificationToken,
      },
    });

    // Enviar email de verificação
    const emailResult = await sendVerificationEmail(email, verificationToken, name);

    if (!emailResult.success) {
      // Se falhou ao enviar email, deletar usuário
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: 'Erro ao enviar email de verificação' },
        { status: 500 }
      );
    }

    // Retornar sucesso
    return NextResponse.json({
      message: 'Usuário criado com sucesso! Verifique seu email para ativar a conta.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
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
