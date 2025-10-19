"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao criar conta');
      }
    } catch (error) {
      setError('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo símbolo */}
          <div className="text-center mb-8">
            <Image
              src="/logo-symbol.png"
              alt="Cripto Manager"
              width={200}
              height={200}
              className="mx-auto h-40 w-40 mb-4"
            />
            <h1 className="text-3xl font-bold text-white">Cripto Manager</h1>
            <p className="text-slate-400 mt-2">Painel profissional de gestão de trades</p>
          </div>

          {/* Mensagem de sucesso */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-4">
              Conta criada com sucesso!
            </h2>
            
            <p className="text-slate-300 mb-6">
              Enviamos um email de verificação para <strong>{email}</strong>. 
              Clique no link do email para ativar sua conta e definir sua senha.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/login" 
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Ir para Login
              </Link>
              
              <button
                onClick={() => {
                  setSuccess(false);
                  setName('');
                  setEmail('');
                }}
                className="block w-full text-slate-400 hover:text-white transition-colors"
              >
                Criar outra conta
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-slate-500">
              © 2024 Cripto Manager. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo símbolo */}
        <div className="text-center mb-8">
          <Image
            src="/logo-symbol.png"
            alt="Cripto Manager"
            width={200}
            height={200}
            className="mx-auto h-40 w-40 mb-4"
          />
          <h1 className="text-3xl font-bold text-white">Cripto Manager</h1>
          <p className="text-slate-400 mt-2">Painel profissional de gestão de trades</p>
        </div>

        {/* Formulário de cadastro */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Criar conta
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-sm">
                📧 Após o cadastro, você receberá um email para verificar sua conta e definir sua senha.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Já tem conta? Fazer login
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            © 2024 Cripto Manager. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
