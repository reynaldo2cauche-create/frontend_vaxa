// ============================================
// API: GET /api/lotes
// Lista todos los lotes de certificados de una empresa
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Lote } from '@/lib/entities/Lote';
import { Certificado } from '@/lib/entities/Certificado';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación desde cookies
    const token = request.cookies.get('vaxa_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const dataSource = await getDataSource();
    const loteRepo = dataSource.getRepository(Lote);
    const certificadoRepo = dataSource.getRepository(Certificado);

    // Parámetros de paginación
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener lotes de la empresa
    const [lotes, total] = await loteRepo.findAndCount({
      where: { empresa_id: decoded.empresa_id },
      order: { fecha_procesado: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });

    // Enriquecer cada lote con estadísticas de certificados
    const lotesConDetalles = await Promise.all(
      lotes.map(async (lote) => {
        const totalCertificados = await certificadoRepo.count({
          where: { lote_id: lote.id }
        });

        const certificadosActivos = await certificadoRepo.count({
          where: { lote_id: lote.id, estado: 'activo' as any }
        });

        const certificadosRevocados = await certificadoRepo.count({
          where: { lote_id: lote.id, estado: 'revocado' as any }
        });

        return {
          id: lote.id,
          nombreArchivo: lote.nombre_archivo,
          cantidadCertificados: lote.cantidad_certificados,
          fechaProcesado: lote.fecha_procesado,
          totalCertificados,
          certificadosActivos,
          certificadosRevocados,
          tieneZip: !!lote.zip_url
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        lotes: lotesConDetalles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener lotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener lotes' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
