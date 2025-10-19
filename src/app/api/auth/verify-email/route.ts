import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // Validações básicas
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        isVerified: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar usuário: verificar conta e definir senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        verificationToken: null, // Limpar token após uso
        emailVerified: new Date(),
      },
    });

    // Retornar sucesso
    return NextResponse.json({
      message: 'Conta verificada e senha definida com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
