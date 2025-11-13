'use client';

import { usePlan } from '@/contexts/PlanContext';
import { useEffect, useRef } from 'react';

export function ActualizadorPlanAuto() {
  const { actualizarPlan } = usePlan();
  const actualizarRef = useRef(actualizarPlan);

  useEffect(() => {
    actualizarRef.current = actualizarPlan;
  }, [actualizarPlan]);

  useEffect(() => {
    (window as any).__actualizarPlanGlobal = () => {
      actualizarRef.current();
    };

    return () => {
      delete (window as any).__actualizarPlanGlobal;
    };
  }, []);

  return null;
}
