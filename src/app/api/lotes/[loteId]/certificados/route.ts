// ============================================
// API: GET /api/lotes/[loteId]/certificados
// Obtiene todos los certificados de un lote específico
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { DatoCertificado } from '@/lib/entities/DatoCertificado';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { loteId: string } }
) {
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

    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json({ error: 'ID de lote inválido' }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);
    const datoCertificadoRepo = dataSource.getRepository(DatoCertificado);

    // Parámetros de búsqueda y paginación
    const searchParams = request.nextUrl.searchParams;
    const busqueda = searchParams.get('busqueda') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir query base
    const qb = certificadoRepo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.participante', 'participante')
      .leftJoinAndSelect('cert.curso', 'curso')
      .where('cert.lote_id = :loteId', { loteId })
      .andWhere('cert.empresa_id = :empresaId', { empresaId: decoded.empresa_id })
      .orderBy('cert.id', 'ASC')
      .take(limit)
      .skip((page - 1) * limit);

    // Agregar búsqueda si existe
    if (busqueda) {
      qb.andWhere(
        '(cert.codigo LIKE :busqueda OR participante.nombres LIKE :busqueda OR participante.apellidos LIKE :busqueda OR participante.numero_documento LIKE :busqueda)',
        { busqueda: `%${busqueda}%` }
      );
    }

    const [certificados, total] = await qb.getManyAndCount();

    // Enriquecer con datos adicionales
    const certificadosConDetalles = await Promise.all(
      certificados.map(async (cert) => {
        // Obtener datos adicionales del certificado
        const datosCert = await datoCertificadoRepo.find({
          where: { certificado_id: cert.id }
        });

        const datosMap: Record<string, string> = {};
        datosCert.forEach(dato => {
          datosMap[dato.campo] = dato.valor;
        });

        return {
          id: cert.id,
          codigo: cert.codigo,
          archivoUrl: cert.archivo_url,
          fechaEmision: cert.fecha_emision,
          estado: cert.estado,
          participanteId: cert.participante_id,
          cursoId: cert.curso_id,
          participante: cert.participante ? {
            id: cert.participante.id,
            nombres: cert.participante.nombres,
            apellidos: cert.participante.apellidos,
            numeroDocumento: cert.participante.numero_documento,
            correo: cert.participante.correo_electronico
          } : null,
          curso: cert.curso ? {
            id: cert.curso.id,
            nombre: cert.curso.nombre,
            horasAcademicas: cert.curso.horas_academicas,
            ponente: cert.curso.ponente
          } : null,
          datosAdicionales: datosMap
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        certificados: certificadosConDetalles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener certificados del lote:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificados' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
