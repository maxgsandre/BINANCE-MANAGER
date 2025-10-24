import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    const testToken = 'test-token-123'; // For testing purposes

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const emailResult = await sendVerificationEmail(email, testToken, name);

    if (!emailResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test email', 
        error: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully', 
      data: emailResult.data 
    });

  } catch (error: unknown) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error during test email send', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}