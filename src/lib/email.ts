import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailDiagnostics = {
  nextauthUrl?: string;
  verificationUrl?: string;
  from: string;
  to: string[];
  nodeEnv?: string;
  vercelEnv?: string;
  hasResendApiKey: boolean;
  resendApiKeyLength?: number;
};

type SendEmailResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  details?: unknown;
  diagnostics?: EmailDiagnostics;
};

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXTAUTH_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined)
    || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const to = [email];
  const diagnostics: EmailDiagnostics = {
    nextauthUrl: process.env.NEXTAUTH_URL,
    verificationUrl,
    from,
    to,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    resendApiKeyLength: process.env.RESEND_API_KEY?.length,
  };

  try {
    // Logs úteis para auditoria/debug sem expor segredos
    console.debug('[email] Attempting to send verification email', {
      to,
      from,
      nextauthUrl: diagnostics.nextauthUrl,
      nodeEnv: diagnostics.nodeEnv,
      vercelEnv: diagnostics.vercelEnv,
      hasResendApiKey: diagnostics.hasResendApiKey,
    });

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: 'Verifique seu email - Cripto Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Cripto Manager</h1>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Olá ${name}!</h2>
            
            <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
              Obrigado por se cadastrar no Cripto Manager! Para ativar sua conta, 
              clique no botão abaixo para verificar seu email:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #1e40af, #3b82f6); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;
                        font-weight: bold;">
                Verificar Email
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${verificationUrl}" style="color: #3b82f6;">${verificationUrl}</a>
            </p>
            
            <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
              Este link expira em 24 horas. Se você não criou esta conta, 
              pode ignorar este email.
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              © 2025 Cripto Manager. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[email] Resend returned error', { error, diagnostics });
      return { success: false, error: 'Erro ao enviar email', details: error, diagnostics };
    }

    console.debug('[email] Resend send success', { data });
    return { success: true, data, diagnostics };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[email] Exception while sending email', { error: errMsg, diagnostics });
    return { success: false, error: 'Erro ao enviar email', details: errMsg, diagnostics };
  }
}
