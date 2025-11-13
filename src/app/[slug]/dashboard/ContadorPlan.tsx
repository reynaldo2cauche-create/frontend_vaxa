'use client';

import { useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { usePlan } from '@/contexts/PlanContext';

export default function ContadorPlan() {
  const { usoPlan, loading, actualizarPlan } = usePlan();

  useEffect(() => {
    actualizarPlan();
  }, [actualizarPlan]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-100 p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usoPlan) return null;

  // Determinar color según porcentaje usado
  const getColorClass = () => {
    if (usoPlan.plan_agotado) return 'text-red-600';
    if (usoPlan.esta_cerca_limite) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getBgColorClass = () => {
    if (usoPlan.plan_agotado) return 'bg-red-50 border-red-200';
    if (usoPlan.esta_cerca_limite) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getProgressBarColor = () => {
    if (usoPlan.plan_agotado) return 'bg-red-600';
    if (usoPlan.esta_cerca_limite) return 'bg-amber-500';
    return 'bg-gradient-to-r from-emerald-500 to-green-600';
  };

  const getIcon = () => {
    if (usoPlan.plan_agotado) return <AlertTriangle className="w-5 h-5" strokeWidth={2} />;
    if (usoPlan.esta_cerca_limite) return <TrendingUp className="w-5 h-5" strokeWidth={2} />;
    return <Package className="w-5 h-5" strokeWidth={2} />;
  };

  return (
    <div className={`rounded-xl border-2 p-6 shadow-lg transition-all ${getBgColorClass()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`${getColorClass()}`}>
            {getIcon()}
          </div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Plan de Certificados
          </h3>
        </div>
        {!usoPlan.plan_agotado && (
          <div className={`flex items-center gap-1 ${getColorClass()}`}>
            <CheckCircle className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-medium">
              {usoPlan.porcentaje_disponible}% disponible
            </span>
          </div>
        )}
      </div>

      {/* Números principales */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${getColorClass()}`}>
            {usoPlan.certificados_emitidos}
          </span>
          <span className="text-2xl text-gray-400 font-medium">
            / {usoPlan.limite_plan}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          certificados emitidos
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
            style={{ width: `${usoPlan.porcentaje_usado}%` }}
          />
        </div>
      </div>

      {/* Información adicional */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-bold ${getColorClass()}`}>
            {usoPlan.certificados_disponibles}
          </p>
          <p className="text-xs text-gray-600">
            Certificados restantes
          </p>
        </div>

        {usoPlan.plan_agotado && (
          <div className="text-right">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              Plan agotado
            </p>
            <p className="text-xs text-red-500">
              Contacta ventas
            </p>
          </div>
        )}

        {usoPlan.esta_cerca_limite && !usoPlan.plan_agotado && (
          <div className="text-right">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Cerca del límite
            </p>
            <p className="text-xs text-amber-500">
              Considera ampliar tu plan
            </p>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Las regeneraciones no consumen del plan
        </p>
      </div>
    </div>
  );
}
