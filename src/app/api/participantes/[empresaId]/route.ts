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
