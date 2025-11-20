// src/app/api/logos/[empresaId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Logo } from '@/lib/entities/Logo';

/**
 * GET /api/logos/[empresaId]
 * Obtiene todos los logos activos de una empresa
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { empresaId: string } }
) {
  try {
    const empresaId = parseInt(params.empresaId);
    
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const logoRepo = ds.getRepository(Logo);

    const logos = await logoRepo.find({
      where: {
        empresaId,
        activo: 1
      },
      order: {
        posicion: 'ASC'
      },
      select: ['id', 'nombre', 'url', 'posicion']
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('Error al obtener logos:', error);
    return NextResponse.json(
      { error: 'Error al cargar logos' },
      { status: 500 }
    );
  }
}
