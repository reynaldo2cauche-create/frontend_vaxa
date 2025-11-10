// ============================================
// API: Gestionar bloques de texto por plantilla
// GET    /api/bloques-texto/[plantillaId] - Obtener bloques
// POST   /api/bloques-texto/[plantillaId] - Crear bloque
// PUT    /api/bloques-texto/[plantillaId] - Actualizar bloques
// DELETE /api/bloques-texto/[plantillaId] - Eliminar bloque
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { BloqueTexto } from '@/lib/entities/BloqueTexto';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';

// GET: Obtener todos los bloques de una plantilla
export async function GET(
  request: NextRequest,
  { params }: { params: { plantillaId: string } }
) {
  try {
    const plantillaId = parseInt(params.plantillaId);
    const dataSource = await getDataSource();
    const bloqueRepo = dataSource.getRepository(BloqueTexto);

    const bloques = await bloqueRepo.find({
      where: { plantilla_id: plantillaId },
      order: { orden: 'ASC' }
    });

    return NextResponse.json(bloques);
  } catch (error) {
    console.error('Error al obtener bloques:', error);
    return NextResponse.json(
      { error: 'Error al cargar bloques de texto' },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo bloque
export async function POST(
  request: NextRequest,
  { params }: { params: { plantillaId: string } }
) {
  try {
    const plantillaId = parseInt(params.plantillaId);
    const body = await request.json();

    const dataSource = await getDataSource();
    const bloqueRepo = dataSource.getRepository(BloqueTexto);

    // Verificar que la plantilla existe
    const plantillaRepo = dataSource.getRepository(PlantillaConfig);
    const plantilla = await plantillaRepo.findOne({
      where: { id: plantillaId }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    const nuevoBloque = bloqueRepo.create({
      plantilla_id: plantillaId,
      nombre: body.nombre,
      contenido: body.contenido,
      x: body.x || 400,
      y: body.y || 300,
      ancho: body.ancho || null,
      font_size: body.font_size || 16,
      font_family: body.font_family || 'Arial',
      font_color: body.font_color || '#000000',
      font_weight: body.font_weight || 'normal',
      alineacion: body.alineacion || 'center',
      line_height: body.line_height || 1.5,
      orden: body.orden || 0,
      activo: true
    });

    await bloqueRepo.save(nuevoBloque);

    return NextResponse.json(nuevoBloque, { status: 201 });
  } catch (error) {
    console.error('Error al crear bloque:', error);
    return NextResponse.json(
      { error: 'Error al crear bloque de texto' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar bloques (batch update)
export async function PUT(
  request: NextRequest,
  { params }: { params: { plantillaId: string } }
) {
  try {
    const plantillaId = parseInt(params.plantillaId);
    const { bloques } = await request.json();

    const dataSource = await getDataSource();
    const bloqueRepo = dataSource.getRepository(BloqueTexto);

    // Actualizar cada bloque
    for (const bloque of bloques) {
      if (bloque.id) {
        await bloqueRepo.update(bloque.id, {
          nombre: bloque.nombre,
          contenido: bloque.contenido,
          x: bloque.x,
          y: bloque.y,
          ancho: bloque.ancho,
          font_size: bloque.font_size,
          font_family: bloque.font_family,
          font_color: bloque.font_color,
          font_weight: bloque.font_weight,
          alineacion: bloque.alineacion,
          line_height: bloque.line_height,
          orden: bloque.orden,
          activo: bloque.activo
        });
      }
    }

    // Obtener bloques actualizados
    const bloquesActualizados = await bloqueRepo.find({
      where: { plantilla_id: plantillaId },
      order: { orden: 'ASC' }
    });

    return NextResponse.json(bloquesActualizados);
  } catch (error) {
    console.error('Error al actualizar bloques:', error);
    return NextResponse.json(
      { error: 'Error al actualizar bloques' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un bloque
export async function DELETE(
  request: NextRequest,
  { params }: { params: { plantillaId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const bloqueId = searchParams.get('id');

    if (!bloqueId) {
      return NextResponse.json(
        { error: 'ID de bloque requerido' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const bloqueRepo = dataSource.getRepository(BloqueTexto);

    await bloqueRepo.delete(parseInt(bloqueId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar bloque:', error);
    return NextResponse.json(
      { error: 'Error al eliminar bloque' },
      { status: 500 }
    );
  }
}
