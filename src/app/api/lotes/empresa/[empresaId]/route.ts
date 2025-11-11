// src/app/api/lotes/empresa/[empresaId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Lote } from '@/lib/entities/Lote';
import { Certificado } from '@/lib/entities/Certificado';

export async function GET(
  request: NextRequest,
  { params }: { params: { empresaId: string } }
) {
  try {
    const empresaId = parseInt(params.empresaId);
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'fecha_procesado';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const dataSource = await getDataSource();
    const loteRepo = dataSource.getRepository(Lote);

    let query = loteRepo
      .createQueryBuilder('lote')
      .leftJoinAndSelect('lote.usuario', 'usuario')
      .leftJoin('lote.certificados', 'certificado')
      .addSelect('COUNT(DISTINCT certificado.id)', 'total_certificados')
      .where('lote.empresa_id = :empresaId', { empresaId })
      .groupBy('lote.id');

    if (search) {
      query = query.andWhere(
        '(lote.curso LIKE :search OR lote.tipo_documento LIKE :search OR lote.nombre_archivo LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const orderColumn = sortBy === 'fecha_procesado' ? 'lote.fecha_procesado' : `lote.${sortBy}`;
    query = query.orderBy(orderColumn, sortOrder as 'ASC' | 'DESC');

    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    const lotes = await query.getRawAndEntities();

    const totalQuery = loteRepo
      .createQueryBuilder('lote')
      .where('lote.empresa_id = :empresaId', { empresaId });
    
    if (search) {
      totalQuery.andWhere(
        '(lote.curso LIKE :search OR lote.tipo_documento LIKE :search OR lote.nombre_archivo LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await totalQuery.getCount();

    const lotesFormateados = await Promise.all(
      lotes.entities.map(async (lote) => {
        const certificadoRepo = dataSource.getRepository(Certificado);
        
        const stats = await certificadoRepo
          .createQueryBuilder('cert')
          .select('COUNT(*)', 'total')
          .addSelect('SUM(CASE WHEN cert.estado = "activo" THEN 1 ELSE 0 END)', 'activos')
          .addSelect('SUM(CASE WHEN cert.estado = "revocado" THEN 1 ELSE 0 END)', 'revocados')
          .where('cert.lote_id = :loteId', { loteId: lote.id })
          .getRawOne();

        return {
          id: lote.id,
          nombre_archivo: lote.nombre_archivo,
          tipo_documento: lote.tipo_documento,
          curso: lote.curso,
          cantidad_certificados: lote.cantidad_certificados,
          fecha_procesado: lote.fecha_procesado,
          zip_url: lote.zip_url,
          usuario: lote.usuario ? {
            id: lote.usuario.id,
            nombre: lote.usuario.nombre,
            email: lote.usuario.email
          } : null,
          estadisticas: {
            total: parseInt(stats.total) || 0,
            activos: parseInt(stats.activos) || 0,
            revocados: parseInt(stats.revocados) || 0
          }
        };
      })
    );

    return NextResponse.json({
      lotes: lotesFormateados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener lotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener lotes' },
      { status: 500 }
    );
  }
}