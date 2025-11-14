'use client';

import { usePlan } from '@/contexts/PlanContext';
import { Award, TrendingUp } from 'lucide-react';

export function ContadorPlan() {
  const { usoPlan, loading } = usePlan();

  if (loading || !usoPlan) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const {
    certificados_emitidos,
    limite_plan,
    certificados_disponibles,
    porcentaje_usado,
    esta_cerca_limite,
    plan_agotado
  } = usoPlan;

  // Determinar color segun uso
  let colorClase = 'bg-green-500';
  let colorTexto = 'text-green-700';
  let colorFondo = 'bg-green-50';
  let colorBorde = 'border-green-200';

  if (plan_agotado) {
    colorClase = 'bg-red-500';
    colorTexto = 'text-red-700';
    colorFondo = 'bg-red-50';
    colorBorde = 'border-red-200';
  } else if (esta_cerca_limite) {
    colorClase = 'bg-amber-500';
    colorTexto = 'text-amber-700';
    colorFondo = 'bg-amber-50';
    colorBorde = 'border-amber-200';
  }

  return (
    <div className={`rounded-xl shadow-sm border-2 ${colorBorde} ${colorFondo} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className={`w-5 h-5 ${colorTexto}`} />
          <h3 className={`font-bold ${colorTexto}`}>Plan de Certificados</h3>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${colorTexto}`} />
          <span className={`text-sm font-semibold ${colorTexto}`}>
            {porcentaje_usado}% usado
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${colorClase} transition-all duration-500 ease-out`}
            style={{ width: `${porcentaje_usado}%` }}
          ></div>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-600">Emitidos</p>
          <p className={`text-lg font-bold ${colorTexto}`}>
            {certificados_emitidos}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Disponibles</p>
          <p className={`text-lg font-bold ${colorTexto}`}>
            {certificados_disponibles}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Total</p>
          <p className={`text-lg font-bold ${colorTexto}`}>
            {limite_plan}
          </p>
        </div>
      </div>

      {/* Mensaje de advertencia */}
      {plan_agotado && (
        <div className="mt-3 text-xs text-red-700 font-medium text-center">
          Plan agotado - Contacta para ampliar tu limite
        </div>
      )}
      {esta_cerca_limite && !plan_agotado && (
        <div className="mt-3 text-xs text-amber-700 font-medium text-center">
          Estas cerca del limite de tu plan
        </div>
      )}
    </div>
  );
}
