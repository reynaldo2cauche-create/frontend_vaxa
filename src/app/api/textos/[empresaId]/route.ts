import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';
import { PlantillaTexto } from '@/lib/entities/PlantillaTexto';

export async function GET(
  req: NextRequest,
  { params }: { params: { empresaId: string } }
) {
  try {
    const empresaId = parseInt(params.empresaId);

    if (!empresaId || isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa invalido' },
        { status: 400 }
      );
    }

    // Inicializar BD si no esta lista
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const plantillaConfigRepo = AppDataSource.getRepository(PlantillaConfig);
    const plantillaTextoRepo = AppDataSource.getRepository(PlantillaTexto);

    // Buscar configuracion de plantilla para esta empresa
    const plantillaConfig = await plantillaConfigRepo.findOne({
      where: { empresa_id: empresaId }
    });

    if (!plantillaConfig) {
      return NextResponse.json({
        textos: [],
        mensaje: 'No hay configuracion para esta empresa'
      });
    }

    // Si tiene plantilla de texto asignada
    if (plantillaConfig.plantilla_texto_id) {
      const plantillaTexto = await plantillaTextoRepo.findOne({
        where: { id: plantillaConfig.plantilla_texto_id }
      });

      if (plantillaTexto) {
        return NextResponse.json({
          textos: [{
            id: plantillaTexto.id,
            tipo: 'plantilla',
            titulo: plantillaTexto.titulo,
            cuerpo: plantillaTexto.cuerpo,
            pie: plantillaTexto.pie,
            categoria: plantillaTexto.categoria
          }]
        });
      }
    }

    // Si no tiene plantilla asignada, devolver vacio
    return NextResponse.json({
      textos: [],
      mensaje: 'No hay textos configurados'
    });

  } catch (error) {
    console.error('Error al obtener textos:', error);
    return NextResponse.json(
      { error: 'Error al obtener textos configurados' },
      { status: 500 }
    );
  }
}
