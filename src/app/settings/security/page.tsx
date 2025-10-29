"use client";
import InternalLayout from '@/components/InternalLayout';
import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function SecurityPage() {
  const [emailSent, setEmailSent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleReset = async () => {
    try {
      setError('');
      const user = auth.currentUser;
      const email = user?.email;
      if (!email) {
        setError('Usuário sem email.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setEmailSent(email);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar email de redefinição');
    }
  };

  return (
    <InternalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl text-white">Segurança</h1>
        <p className="text-slate-400">Redefina sua senha via email.</p>
        <div className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">{error}</div>
          )}
          {emailSent ? (
            <div className="p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm">
              Email de redefinição enviado para {emailSent}
            </div>
          ) : null}
          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Enviar email de redefinição de senha
          </button>
        </div>
      </div>
    </InternalLayout>
  );
}


