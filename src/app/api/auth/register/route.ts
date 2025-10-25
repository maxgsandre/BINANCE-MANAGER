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

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        name,
        email,
        isVerified: false,
        verificationToken,
        emailVerified: tokenExpiry
      }
    });

    // Enviar email de verificação
    const emailResult = await sendVerificationEmail(email, verificationToken, name);

    if (!emailResult.success) {
      // Se falhou ao enviar email, remover o usuário criado
      await prisma.user.delete({
        where: { id: user.id }
      });

      return NextResponse.json({
        error: 'Erro ao enviar email de verificação. Tente novamente.',
        emailService: 'resend',
        details: emailResult.details,
        diagnostics: emailResult.diagnostics,
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Conta criada com sucesso! Verifique seu email para ativar a conta.',
      data: { 
        id: user.id,
        name: user.name,
        email: user.email 
      },
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
