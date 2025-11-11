// ============================================
// API: GET /api/participantes/[empresaId]
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Participante } from '@/lib/entities/Participante';

export async function GET(
  request: NextRequest,
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

    const dataSource = await getDataSource();
    const participanteRepo = dataSource.getRepository(Participante);

    // Query params para búsqueda
    const searchParams = request.nextUrl.searchParams;
    const documento = searchParams.get('documento');
    const nombre = searchParams.get('nombre');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const qb = participanteRepo
      .createQueryBuilder('p')
      .where('p.empresa_id = :empresaId', { empresaId })
      .orderBy('p.created_at', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    // Filtros opcionales
    if (documento) {
      qb.andWhere('p.numero_documento LIKE :documento', { documento: `%${documento}%` });
    }

    if (nombre) {
      qb.andWhere('(p.nombres LIKE :nombre OR p.apellidos LIKE :nombre)', { nombre: `%${nombre}%` });
    }

    const [participantes, total] = await qb.getManyAndCount();

    return NextResponse.json({
      participantes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return NextResponse.json(
      { error: 'Error al obtener participantes' },
      { status: 500 }
    );
  }
}
// PUT - Actualizar un participante
export async function PUT(
  request: NextRequest,
  { params }: { params: { empresaId: string } }
) {
  try {
    const body = await request.json();
    const { participante_id, termino, nombres, apellidos, correo_electronico } = body;

    if (!participante_id) {
      return NextResponse.json(
        { error: 'participante_id es requerido' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const partRepo = dataSource.getRepository(Participante);

    const participante = await partRepo.findOne({
      where: { id: participante_id }
    });

    if (!participante) {
      return NextResponse.json(
        { error: 'Participante no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar campos
    if (termino !== undefined) {
      participante.termino = termino || null;
    }
    if (nombres !== undefined) {
      participante.nombres = nombres;
    }
    if (apellidos !== undefined) {
      participante.apellidos = apellidos;
    }
    if (correo_electronico !== undefined) {
      participante.correo_electronico = correo_electronico || null;
    }

    await partRepo.save(participante);

    return NextResponse.json({
      success: true,
      participante: {
        id: participante.id,
        termino: participante.termino,
        nombres: participante.nombres,
        apellidos: participante.apellidos,
        correo_electronico: participante.correo_electronico
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar participante:', error);
    return NextResponse.json(
      { error: 'Error al actualizar participante' },
      { status: 500 }
    );
  }
}