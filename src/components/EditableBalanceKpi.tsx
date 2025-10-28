"use client";
import { useState } from 'react';
import { auth } from '@/lib/firebase/client';

type EditableBalanceKpiProps = {
  label: string;
  value: string;
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  month: string;
};

const colorClasses = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-emerald-500 to-green-500',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-pink-500',
  orange: 'from-orange-500 to-amber-500',
};

const bgColors = {
  blue: 'from-blue-500/10 to-cyan-500/10',
  green: 'from-emerald-500/10 to-green-500/10',
  red: 'from-red-500/10 to-red-600/10',
  purple: 'from-purple-500/10 to-pink-500/10',
  orange: 'from-orange-500/10 to-amber-500/10',
};

function EditableBalanceKpi({ label, value, icon = '💳', color = 'purple', month }: EditableBalanceKpiProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Usuário não autenticado');
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      const token = await user.getIdToken();
      
      const response = await fetch('/api/monthly-balance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ month, initialBalance: editValue })
      });

      if (response.ok) {
        const result = await response.json();
        setIsEditing(false);
        setDisplayValue(result.balance || editValue);
      } else {
        alert('Erro ao salvar saldo');
      }
    } catch (error) {
      console.error('Error saving balance:', error);
      alert('Erro ao salvar saldo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  if (isEditing) {
    return (
      <div className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-6">
        <div className="space-y-4">
          <label className="text-slate-400 text-sm">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1000"
            />
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Salvar"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
              title="Cancelar"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:from-white/10 hover:to-white/5 transition-all duration-300 group rounded-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColors[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
          <button 
            onClick={handleEdit}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Editar saldo"
          >
            <span className="text-white text-sm">✏️</span>
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className="text-white text-2xl tracking-tight">R$ {displayValue}</p>
      </div>
    </div>
  );
}

export default EditableBalanceKpi;
