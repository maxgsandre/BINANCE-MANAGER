"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { isSignInWithEmailLink, signInWithEmailLink, updatePassword, updateProfile } from 'firebase/auth';

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmail = window.localStorage.getItem('signupEmail') || '';
    const storedName = window.localStorage.getItem('signupName') || searchParams.get('name') || '';
    setEmail(storedEmail);
    setName(storedName);

    const url = window.location.href;
    if (isSignInWithEmailLink(auth, url)) {
      setLoading(false);
    } else {
      setError('Link inválido ou expirado.');
      setLoading(false);
    }
  }, [searchParams]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    try {
      const url = window.location.href;
      const finalEmail = email || window.prompt('Confirme seu email:') || '';
      const cred = await signInWithEmailLink(auth, finalEmail, url);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await updatePassword(cred.user, password);
      window.localStorage.removeItem('signupEmail');
      window.localStorage.removeItem('signupName');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao concluir cadastro');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">Carregando...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10">
        <h1 className="text-white text-xl font-semibold mb-4">Concluir cadastro</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            Concluir cadastro
          </button>
        </form>
      </div>
    </div>
  );
}



