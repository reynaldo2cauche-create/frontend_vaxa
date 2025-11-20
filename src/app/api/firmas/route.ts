// src/app/api/firmas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { FirmaDigital, EstadoFirma } from '@/lib/entities/FirmaDigital';

/**
 * GET /api/firmas?empresaId={id}
 * Obtiene todas las firmas activas de una empresa
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId es requerido' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const firmaRepo = ds.getRepository(FirmaDigital);

    const firmas = await firmaRepo.find({
      where: {
        empresaId: parseInt(empresaId),
        estado: EstadoFirma.ACTIVO
      },
      order: {
        id: 'ASC'
      }
    });

    return NextResponse.json({
      success: true,
      data: firmas.map(f => ({
        id: f.id,
        nombre: f.nombre,
        cargo: f.cargo,
        firmaUrl: f.firmaUrl
      }))
    });
  } catch (error) {
    console.error('Error al obtener firmas:', error);
    return NextResponse.json(
      { error: 'Error al obtener firmas' },
      { status: 500 }
    );
  }
}
