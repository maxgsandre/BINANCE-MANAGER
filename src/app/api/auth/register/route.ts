import { NextRequest, NextResponse } from 'next/server';
// Legacy server route kept from the previous NextAuth + Resend approach.
// Firebase Auth email-link flow não usa este endpoint; vamos desativá-lo para evitar quebras no build.

export async function POST(req: NextRequest) {
  return NextResponse.json({
    disabled: true,
    message: 'This route is disabled. Registration is handled by Firebase email-link flow via the /register page.'
  }, { status: 410 });
}
