// ============================================
// API: GET /api/plan/uso
// Obtiene el uso actual del plan de la empresa
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PlanService } from '@/lib/services/PlanService';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('vaxa_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener uso del plan
    const uso = await PlanService.obtenerUsoPlan(decoded.empresa_id);

    return NextResponse.json({
      success: true,
      data: uso
    });

  } catch (error) {
    console.error('Error al obtener uso del plan:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener uso del plan' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
