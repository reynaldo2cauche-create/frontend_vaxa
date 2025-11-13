// Hook personalizado que permite acceder al plan desde componentes hijos del PlanProvider
'use client';

import { usePlan } from '@/contexts/PlanContext';
import { useEffect, useRef } from 'react';

export function ActualizadorPlanAuto() {
  const { actualizarPlan } = usePlan();
  const actualizarRef = useRef(actualizarPlan);

  // Actualizar la ref cuando cambie la función
  useEffect(() => {
    actualizarRef.current = actualizarPlan;
  }, [actualizarPlan]);

  // Exponer la función globalmente para que pueda ser llamada desde el dashboard
  useEffect(() => {
    (window as any).__actualizarPlanGlobal = () => {
      actualizarRef.current();
    };

    return () => {
      delete (window as any).__actualizarPlanGlobal;
    };
  }, []);

  return null; // Este componente no renderiza nada
}
