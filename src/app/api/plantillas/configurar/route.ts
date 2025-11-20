import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';
import { CampoPlantilla } from '@/lib/entities/CampoPlantilla';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, campos, qr, codigo } = body;

    if (!empresaId || !campos) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const plantillaRepo = dataSource.getRepository(PlantillaConfig);
    const campoRepo = dataSource.getRepository(CampoPlantilla);

    // Buscar plantilla existente
    let plantilla = await plantillaRepo.findOne({
      where: { empresa_id: empresaId }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'No hay plantilla configurada para esta empresa' },
        { status: 404 }
      );
    }

    // Actualizar QR y código si se proporcionan
    if (qr) {
      plantilla.qr_x = qr.x;
      plantilla.qr_y = qr.y;
      plantilla.qr_size = qr.size;
    }

    if (codigo) {
      plantilla.codigo_x = codigo.x;
      plantilla.codigo_y = codigo.y;
      plantilla.codigo_size = codigo.size;
      plantilla.codigo_color = codigo.color;
    }

    plantilla.updated_at = new Date();
    await plantillaRepo.save(plantilla);

    // Eliminar campos anteriores
    await campoRepo.delete({ plantilla_id: plantilla.id });

    // Crear nuevos campos
    const nuevosCampos = campos.map((campo: any, index: number) =>
      campoRepo.create({
        plantilla_id: plantilla!.id,
        nombre_campo: campo.nombre_campo,
        label: campo.label,
        x: campo.x,
        y: campo.y,
        font_size: campo.font_size,
        font_family: campo.font_family,
        font_color: campo.font_color,
        orden: index + 1,
        requerido: campo.requerido
      })
    );

    await campoRepo.save(nuevosCampos);

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente'
    });

  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
