'use client';

import { usePlan } from '@/contexts/PlanContext';
import { Award, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

export function ContadorPlan() {
  const { usoPlan, loading } = usePlan();

  if (loading || !usoPlan) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-pulse mb-8">
        <div className="h-32 bg-gray-100 rounded-2xl"></div>
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

  // Determinar colores y estado
  let gradiente = 'from-emerald-500 to-green-600';
  let colorIcono = 'text-emerald-600';
  let colorFondo = 'from-emerald-50 to-green-50';
  let colorBorde = 'border-emerald-200';
  let colorTexto = 'text-emerald-900';
  let colorBadge = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  let icono = <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />;
  let estado = 'Excelente';

  if (plan_agotado) {
    gradiente = 'from-red-500 to-rose-600';
    colorIcono = 'text-red-600';
    colorFondo = 'from-red-50 to-rose-50';
    colorBorde = 'border-red-200';
    colorTexto = 'text-red-900';
    colorBadge = 'bg-red-100 text-red-700 border-red-200';
    icono = <XCircle className="w-6 h-6" strokeWidth={2.5} />;
    estado = '¡Límite alcanzado!';
  } else if (esta_cerca_limite) {
    gradiente = 'from-amber-500 to-orange-600';
    colorIcono = 'text-amber-600';
    colorFondo = 'from-amber-50 to-orange-50';
    colorBorde = 'border-amber-200';
    colorTexto = 'text-amber-900';
    colorBadge = 'bg-amber-100 text-amber-700 border-amber-200';
    icono = <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />;
    estado = 'Cerca del límite';
  }

  return (
    <div className={`group bg-gradient-to-br ${colorFondo} rounded-3xl shadow-sm border-2 ${colorBorde} p-8 transition-all duration-300 hover:shadow-xl mb-8 relative overflow-hidden`}>
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-30 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-500"></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <div className={colorIcono}>
                {icono}
              </div>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${colorTexto} flex items-center gap-2`}>
                Plan de Certificados
                <Zap className="w-4 h-4" />
              </h3>
              <p className="text-sm text-gray-600 font-medium">{estado}</p>
            </div>
          </div>

          <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${colorBadge} shadow-sm`}>
            {porcentaje_usado}%
          </span>
        </div>

        {/* Progreso visual mejorado */}
        <div className="mb-6">
          <div className="flex justify-between items-baseline mb-3">
            <span className={`text-4xl font-bold ${colorTexto} tracking-tight`}>
              {certificados_emitidos}
            </span>
            <span className="text-base text-gray-600 font-medium">
              de <span className="font-bold text-gray-800">{limite_plan}</span>
            </span>
          </div>

          {/* Barra de progreso mejorada */}
          <div className="relative w-full h-4 bg-white/70 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${gradiente} transition-all duration-700 ease-out rounded-full shadow-lg relative`}
              style={{ width: `${Math.min(porcentaje_usado, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Estadísticas en grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/60 hover:bg-white transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-gray-600 font-semibold">Emitidos</p>
            </div>
            <p className={`text-2xl font-bold ${colorTexto}`}>
              {certificados_emitidos}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/60 hover:bg-white transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-600 font-semibold">Disponibles</p>
            </div>
            <p className={`text-2xl font-bold ${colorTexto}`}>
              {certificados_disponibles}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/60 hover:bg-white transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600 font-semibold">Límite</p>
            </div>
            <p className={`text-2xl font-bold ${colorTexto}`}>
              {limite_plan}
            </p>
          </div>
        </div>

        {/* Mensajes de advertencia mejorados */}
        {plan_agotado && (
          <div className="mt-6 p-4 bg-red-100/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl">
            <p className="text-sm text-red-800 font-bold text-center">
              ⚠️ Has alcanzado el límite de tu plan. Contacta a soporte para ampliarlo.
            </p>
          </div>
        )}

        {esta_cerca_limite && !plan_agotado && (
          <div className="mt-6 p-4 bg-amber-100/80 backdrop-blur-sm border-2 border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-800 font-bold text-center">
              ⚠️ Te quedan solo {certificados_disponibles} certificados. Considera ampliar tu plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
