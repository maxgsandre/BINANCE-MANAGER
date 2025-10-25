import { NextRequest, NextResponse } from 'next/server';
// Disabled: legacy Resend test endpoint. Kept returning build errors on Vercel when RESEND_API_KEY is not set.

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    const testToken = 'test-token-123'; // For testing purposes

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    return NextResponse.json({
      disabled: true,
      message: 'Email test route disabled. Use Firebase email-link flow instead.'
    }, { status: 410 });

  } catch (error: unknown) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error during test email send', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}