'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

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
        const uso = data.data;

        // Adaptar datos del API al formato del contexto
        setUsoPlan({
          certificados_emitidos: uso.certificados_emitidos,
          limite_plan: uso.limite_plan,
          certificados_disponibles: uso.certificados_disponibles,
          porcentaje_usado: Math.round(uso.porcentaje_uso), // Redondear
          porcentaje_disponible: Math.round(100 - uso.porcentaje_uso),
          esta_cerca_limite: uso.alerta_limite,
          plan_agotado: !uso.puede_generar
        });
      }
    } catch (error) {
      console.error('Error al obtener uso del plan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🆕 Cargar datos automáticamente al montar el componente
  useEffect(() => {
    actualizarPlan();
  }, [actualizarPlan]);

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
