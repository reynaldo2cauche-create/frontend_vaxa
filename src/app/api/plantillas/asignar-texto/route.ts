// ============================================
// API: Asignar plantilla de texto predefinida
// POST /api/plantillas/asignar-texto
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';

export async function POST(request: NextRequest) {
  try {
    const { empresaId, plantillaTextoId } = await request.json();

    if (!empresaId) {
      return NextResponse.json(
        { error: 'ID de empresa requerido' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const plantillaRepo = dataSource.getRepository(PlantillaConfig);

    // Buscar o crear configuración de plantilla
    let plantilla = await plantillaRepo.findOne({
      where: { empresa_id: empresaId }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Configuración de plantilla no encontrada. Primero sube una imagen de fondo.' },
        { status: 404 }
      );
    }

    // Actualizar plantilla_texto_id
    await plantillaRepo.update(
      { empresa_id: empresaId },
      { plantilla_texto_id: plantillaTextoId || null }
    );

    return NextResponse.json({
      success: true,
      message: 'Plantilla asignada correctamente'
    });
  } catch (error) {
    console.error('Error al asignar plantilla de texto:', error);
    return NextResponse.json(
      { error: 'Error al asignar plantilla' },
      { status: 500 }
    );
  }
}
