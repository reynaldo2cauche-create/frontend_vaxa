'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UsoPlan {
  certificados_emitidos: number;
  limite_plan: number;
  certificados_disponibles: number;
  porcentaje_usado: number;
  porcentaje_disponible: number;
  esta_cerca_limite: boolean;
  plan_agotado: boolean;
}

interface PlanContextType {
  usoPlan: UsoPlan | null;
  loading: boolean;
  actualizarPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [usoPlan, setUsoPlan] = useState<UsoPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const actualizarPlan = useCallback(async () => {
    try {
      const response = await fetch('/api/plan/uso', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsoPlan(data.data);
      }
    } catch (error) {
      console.error('Error al obtener uso del plan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PlanContext.Provider value={{ usoPlan, loading, actualizarPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan debe usarse dentro de un PlanProvider');
  }
  return context;
}
