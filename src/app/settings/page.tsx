"use client";
import InternalLayout from '@/components/InternalLayout';

export default function SettingsPage() {
  return (
    <InternalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl text-white">Configurações</h1>
        <p className="text-slate-400">Gerencie preferências da sua conta e do aplicativo.</p>
        <div className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-6">
          <p className="text-slate-300">Em breve: temas, preferências, notificações.</p>
        </div>
      </div>
    </InternalLayout>
  );
}


