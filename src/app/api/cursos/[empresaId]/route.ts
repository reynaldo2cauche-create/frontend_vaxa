// ============================================
// API: GET /api/cursos/[empresaId]
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Curso } from '@/lib/entities/Curso';

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
    const cursoRepo = dataSource.getRepository(Curso);

    // Query params para búsqueda
    const searchParams = request.nextUrl.searchParams;
    const nombre = searchParams.get('nombre');
    const activo = searchParams.get('activo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const qb = cursoRepo
      .createQueryBuilder('c')
      .where('c.empresa_id = :empresaId', { empresaId })
      .orderBy('c.created_at', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    // Filtros opcionales
    if (nombre) {
      qb.andWhere('c.nombre LIKE :nombre', { nombre: `%${nombre}%` });
    }

    if (activo !== null && activo !== undefined) {
      qb.andWhere('c.activo = :activo', { activo: activo === 'true' });
    }

    const [cursos, total] = await qb.getManyAndCount();

    return NextResponse.json({
      cursos,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener cursos' },
      { status: 500 }
    );
  }
}
