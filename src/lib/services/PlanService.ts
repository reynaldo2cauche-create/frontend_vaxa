// ============================================
// 📁 lib/services/PlanService.ts
// Servicio para gestionar límites y validaciones del plan
// ============================================

import { getDataSource } from '@/lib/db';
import { Empresa } from '@/lib/entities/Empresa';

export interface UsoPlan {
  certificados_emitidos: number;
  limite_plan: number;
  certificados_disponibles: number;
  porcentaje_uso: number;
  puede_generar: boolean;
  alerta_limite: boolean; // true si está cerca del límite (>80%)
}

export class PlanService {
  /**
   * Obtiene el uso actual del plan de una empresa
   */
  static async obtenerUsoPlan(empresaId: number): Promise<UsoPlan> {
    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    const empresa = await empresaRepo.findOne({
      where: { id: empresaId }
    });

    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    const certificados_emitidos = empresa.certificados_emitidos || 0;
    const limite_plan = empresa.limite_plan || 100;
    const certificados_disponibles = Math.max(0, limite_plan - certificados_emitidos);
    const porcentaje_uso = (certificados_emitidos / limite_plan) * 100;
    const puede_generar = certificados_emitidos < limite_plan;
    const alerta_limite = porcentaje_uso >= 80;

    return {
      certificados_emitidos,
      limite_plan,
      certificados_disponibles,
      porcentaje_uso,
      puede_generar,
      alerta_limite
    };
  }

  /**
   * Valida si se puede generar una cantidad específica de certificados
   */
  static async validarGeneracion(
    empresaId: number,
    cantidad: number
  ): Promise<{
    permitido: boolean;
    mensaje: string;
    uso: UsoPlan;
  }> {
    const uso = await this.obtenerUsoPlan(empresaId);

    if (!uso.puede_generar) {
      return {
        permitido: false,
        mensaje: `Has alcanzado el límite de tu plan (${uso.limite_plan} certificados). Contacta a soporte para ampliar tu plan.`,
        uso
      };
    }

    if (cantidad > uso.certificados_disponibles) {
      return {
        permitido: false,
        mensaje: `No puedes generar ${cantidad} certificados. Solo tienes ${uso.certificados_disponibles} certificados disponibles en tu plan.`,
        uso
      };
    }

    // Advertencia si después de generar pasará del 80%
    const porcentajeDespues = ((uso.certificados_emitidos + cantidad) / uso.limite_plan) * 100;

    if (porcentajeDespues >= 80 && porcentajeDespues < 100) {
      return {
        permitido: true,
        mensaje: `Advertencia: Después de generar estos ${cantidad} certificados, habrás usado el ${porcentajeDespues.toFixed(0)}% de tu plan.`,
        uso
      };
    }

    return {
      permitido: true,
      mensaje: 'Generación permitida',
      uso
    };
  }

  /**
   * Incrementa el contador de certificados emitidos
   */
  static async incrementarContador(
    empresaId: number,
    cantidad: number
  ): Promise<void> {
    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    await empresaRepo.increment(
      { id: empresaId },
      'certificados_emitidos',
      cantidad
    );

    console.log(`📊 Contador actualizado: +${cantidad} certificados para empresa ${empresaId}`);
  }

  /**
   * Decrementa el contador (por ejemplo, al eliminar certificados)
   */
  static async decrementarContador(
    empresaId: number,
    cantidad: number
  ): Promise<void> {
    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    await empresaRepo.decrement(
      { id: empresaId },
      'certificados_emitidos',
      cantidad
    );

    console.log(`📊 Contador actualizado: -${cantidad} certificados para empresa ${empresaId}`);
  }

  /**
   * Resetea el contador (solo para admin)
   */
  static async resetearContador(empresaId: number): Promise<void> {
    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    await empresaRepo.update(
      { id: empresaId },
      { certificados_emitidos: 0 }
    );

    console.log(`🔄 Contador reseteado para empresa ${empresaId}`);
  }

  /**
   * Actualiza el límite del plan
   */
  static async actualizarLimitePlan(
    empresaId: number,
    nuevoLimite: number
  ): Promise<void> {
    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    await empresaRepo.update(
      { id: empresaId },
      { limite_plan: nuevoLimite }
    );

    console.log(`📈 Límite del plan actualizado a ${nuevoLimite} para empresa ${empresaId}`);
  }
}
