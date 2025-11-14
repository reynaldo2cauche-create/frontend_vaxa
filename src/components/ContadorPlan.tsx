'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface UsoPlan {
  certificados_emitidos: number;
  limite_plan: number;
  certificados_disponibles: number;
  porcentaje_uso: number;
  puede_generar: boolean;
  alerta_limite: boolean;
}

export default function ContadorPlan() {
  const [usoPlan, setUsoPlan] = useState<UsoPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsoPlan();
  }, []);

  const cargarUsoPlan = async () => {
    try {
      const response = await fetch('/api/plan/uso', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsoPlan(data.data);
      }
    } catch (error) {
      console.error('Error al cargar uso del plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!usoPlan) return null;

  // Determinar color según el porcentaje de uso
  const getColorClasses = () => {
    if (usoPlan.porcentaje_uso >= 100) {
      return {
        bg: 'from-red-50 to-rose-50',
        border: 'border-red-200',
        text: 'text-red-900',
        progress: 'bg-gradient-to-r from-red-500 to-rose-600',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700 border-red-200'
      };
    } else if (usoPlan.porcentaje_uso >= 80) {
      return {
        bg: 'from-amber-50 to-orange-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        progress: 'bg-gradient-to-r from-amber-500 to-orange-600',
        icon: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700 border-amber-200'
      };
    } else {
      return {
        bg: 'from-emerald-50 to-green-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        progress: 'bg-gradient-to-r from-emerald-500 to-green-600',
        icon: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl shadow-sm border-2 ${colors.border} p-6 transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
            {usoPlan.porcentaje_uso >= 100 ? (
              <XCircle className={`w-5 h-5 ${colors.icon}`} strokeWidth={2.5} />
            ) : usoPlan.alerta_limite ? (
              <AlertTriangle className={`w-5 h-5 ${colors.icon}`} strokeWidth={2.5} />
            ) : (
              <CheckCircle2 className={`w-5 h-5 ${colors.icon}`} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${colors.text}`}>
              Plan de Certificados
            </h3>
            <p className="text-xs text-gray-600">
              {usoPlan.porcentaje_uso >= 100
                ? '¡Límite alcanzado!'
                : usoPlan.alerta_limite
                ? 'Cerca del límite'
                : 'Todo en orden'}
            </p>
          </div>
        </div>

        {/* Badge de estado */}
        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${colors.badge}`}>
          {usoPlan.porcentaje_uso.toFixed(0)}%
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className={`text-2xl font-bold ${colors.text}`}>
            {usoPlan.certificados_emitidos}
          </span>
          <span className="text-sm text-gray-600">
            de <span className="font-semibold">{usoPlan.limite_plan}</span>
          </span>
        </div>

        <div className="relative w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full ${colors.progress} transition-all duration-500 ease-out rounded-full shadow-lg`}
            style={{ width: `${Math.min(usoPlan.porcentaje_uso, 100)}%` }}
          />
        </div>
      </div>

      {/* Info adicional */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 rounded-xl p-3 border border-white/40">
          <p className="text-xs text-gray-600 mb-1">Disponibles</p>
          <p className={`text-lg font-bold ${colors.text}`}>
            {usoPlan.certificados_disponibles}
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 border border-white/40">
          <p className="text-xs text-gray-600 mb-1">Usados</p>
          <p className={`text-lg font-bold ${colors.text}`}>
            {usoPlan.certificados_emitidos}
          </p>
        </div>
      </div>

      {/* Mensaje de advertencia o info */}
      {usoPlan.porcentaje_uso >= 100 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800 font-medium">
            ⚠️ Has alcanzado el límite de tu plan. Contacta a soporte para ampliarlo.
          </p>
        </div>
      )}

      {usoPlan.alerta_limite && usoPlan.porcentaje_uso < 100 && (
        <div className="mt-4 p-3 bg-amber-100 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 font-medium">
            ⚠️ Te quedan solo {usoPlan.certificados_disponibles} certificados. Considera ampliar tu plan.
          </p>
        </div>
      )}
    </div>
  );
}
