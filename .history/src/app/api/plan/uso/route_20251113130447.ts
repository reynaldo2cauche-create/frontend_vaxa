// ============================================
// =Á app/api/plan/uso/route.ts
// <• Endpoint para consultar el uso del plan de certificados
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Empresa } from '@/lib/entities/Empresa';
import { Usuario } from '@/lib/entities/Usuario';

export async function GET(request: NextRequest) {
  try {
    // 1. Inicializar base de datos
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // 2. Obtener usuario autenticado
    const usuarioId = request.cookies.get('usuario_id')?.value;

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 3. Obtener usuario con empresa
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: { id: parseInt(usuarioId) },
      relations: ['empresa']
    });

    if (!usuario || !usuario.empresa) {
      return NextResponse.json(
        { success: false, error: 'Usuario o empresa no encontrada' },
        { status: 404 }
      );
    }

    // 4. Obtener datos del plan
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const empresa = await empresaRepo.findOne({
      where: { id: usuario.empresa.id }
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // 5. Calcular datos del plan
    const certificadosEmitidos = empresa.certificados_emitidos || 0;
    const limitePlan = empresa.limite_plan || 100;
    const certificadosDisponibles = Math.max(0, limitePlan - certificadosEmitidos);
    const porcentajeUsado = Math.round((certificadosEmitidos / limitePlan) * 100);
    const porcentajeDisponible = Math.max(0, 100 - porcentajeUsado);

    return NextResponse.json({
      success: true,
      data: {
        certificados_emitidos: certificadosEmitidos,
        limite_plan: limitePlan,
        certificados_disponibles: certificadosDisponibles,
        porcentaje_usado: porcentajeUsado,
        porcentaje_disponible: porcentajeDisponible,
        esta_cerca_limite: porcentajeUsado >= 80,
        plan_agotado: certificadosDisponibles <= 0
      }
    });

  } catch (error) {
    console.error('L Error al consultar uso del plan:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar uso del plan' },
      { status: 500 }
    );
  }
}
