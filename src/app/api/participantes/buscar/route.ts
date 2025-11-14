// ============================================
// API: GET /api/participantes/buscar
// Búsqueda global de participantes con historial
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Participante } from '@/lib/entities/Participante';
import { Certificado } from '@/lib/entities/Certificado';
import { Usuario } from '@/lib/entities/Usuario';

export async function GET(request: NextRequest) {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresaId');
    const termino = searchParams.get('termino');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId es requerido' },
        { status: 400 }
      );
    }

    if (!termino || termino.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'La búsqueda debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando participante con termino: "${termino}" en empresa ${empresaId}`);

    const participanteRepo = AppDataSource.getRepository(Participante);

    // Búsqueda por nombre o DNI
    const participantes = await participanteRepo
      .createQueryBuilder('p')
      .where('p.empresa_id = :empresaId', { empresaId: parseInt(empresaId) })
      .andWhere(
        '(p.nombres LIKE :termino OR p.apellidos LIKE :termino OR p.numero_documento LIKE :termino OR p.correo_electronico LIKE :termino)',
        { termino: `%${termino}%` }
      )
      .orderBy('p.created_at', 'DESC')
      .take(50)
      .getMany();

    console.log(`📋 Participantes encontrados: ${participantes.length}`);

    if (participantes.length === 0) {
      console.log('❌ No se encontró ningún participante');
      return NextResponse.json(
        { success: false, error: 'No se encontraron participantes' },
        { status: 404 }
      );
    }

    // Obtener certificados para TODOS los participantes encontrados
    const certificadoRepo = AppDataSource.getRepository(Certificado);

    const participantesConCertificados = await Promise.all(
      participantes.map(async (participante) => {

        const certificados = await certificadoRepo
          .createQueryBuilder('c')
          .leftJoinAndSelect('c.lote', 'l')
          .where('c.participante_id = :participanteId', { participanteId: participante.id })
          .orderBy('c.fecha_emision', 'DESC')
          .getMany();

        console.log(`🔍 Participante: ${participante.nombres} ${participante.apellidos} - Certificados: ${certificados.length}`);

        const certificadosFormateados = certificados.map(cert => {
          // 🆕 PRIORIDAD: usar cert.nombre_override directamente de la tabla certificados
          const nombreCompleto = [participante.termino, participante.nombres, participante.apellidos]
            .filter(Boolean)
            .join(' ')
            .trim();

          // Construir la URL completa del PDF
          let pdfUrl = cert.archivo_url;
          if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
            pdfUrl = '/' + pdfUrl;
          }

          return {
            id: cert.id,
            codigo_unico: cert.codigo || 'SIN-CODIGO',
            nombre_actual: cert.nombre_override || nombreCompleto, // 🔑 Usar cert.nombre_override
            tiene_override: !!cert.nombre_override, // 🔑 Verificar cert.nombre_override
            tipo_documento: cert.lote?.tipo_documento || 'Certificado',
            curso: cert.lote?.curso || 'Sin curso',
            fecha_emision: cert.fecha_emision,
            pdf_url: pdfUrl,
            lote_id: cert.lote?.id
          };
        });

        return {
          id: participante.id,
          dni: participante.numero_documento,
          nombre: [participante.nombres, participante.apellidos].filter(Boolean).join(' '),
          email: participante.correo_electronico,
          telefono: participante.telefono || '',
          empresa_id: participante.empresa_id,
          certificados: certificadosFormateados
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: participantesConCertificados,
      total: participantesConCertificados.length
    });

  } catch (error) {
    console.error('❌ Error al buscar participantes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar participantes' },
      { status: 500 }
    );
  }
}
