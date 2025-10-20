import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    // Teste simples do Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Cripto Manager <noreply@criptomanager.com>',
      to: ['test@example.com'], // Email de teste
      subject: 'Teste de Email - Cripto Manager',
      html: '<p>Este é um teste de email do Cripto Manager.</p>',
    });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar email', 
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email de teste enviado com sucesso',
      data 
    });

  } catch (error) {
    console.error('Erro no teste de email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
