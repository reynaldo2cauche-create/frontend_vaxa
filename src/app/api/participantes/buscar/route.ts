// ============================================
// API: GET /api/participantes/buscar
// Búsqueda global de participantes con historial
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Participante } from '@/lib/entities/Participante';
import { Certificado } from '@/lib/entities/Certificado';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresaId');
    const query = searchParams.get('query'); // Búsqueda por nombre, DNI o email

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId es requerido' },
        { status: 400 }
      );
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'La búsqueda debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const participanteRepo = dataSource.getRepository(Participante);

    // Búsqueda por nombre, DNI o email
    const participantes = await participanteRepo
      .createQueryBuilder('p')
      .where('p.empresa_id = :empresaId', { empresaId: parseInt(empresaId) })
      .andWhere(
        '(p.nombres LIKE :query OR p.apellidos LIKE :query OR p.numero_documento LIKE :query OR p.correo_electronico LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('p.created_at', 'DESC')
      .take(50) // Límite de resultados
      .getMany();

    // Para cada participante, obtener su historial de certificados CON RELACIONES Y DATOS
    const participantesConHistorial = await Promise.all(
      participantes.map(async (participante) => {
        const certificadoRepo = dataSource.getRepository(Certificado);

        const certificados = await certificadoRepo
          .createQueryBuilder('c')
          .leftJoinAndSelect('c.lote', 'l')
          .leftJoinAndSelect('c.participante', 'p')
          .leftJoinAndSelect('c.datos', 'd') // 🆕 Incluir datos del certificado
          .where('c.participante_id = :participanteId', { participanteId: participante.id })
          .orderBy('c.fecha_emision', 'DESC')
          .getMany();

        console.log(`✅ Participante ${participante.id} - Certificados encontrados:`, certificados.length);
        certificados.forEach(cert => {
          console.log(`   - Certificado ${cert.id}: código = "${cert.codigo}", lote = ${cert.lote?.id}`);
        });

        return {
          id: participante.id,
          termino: participante.termino,
          nombres: participante.nombres,
          apellidos: participante.apellidos,
          numero_documento: participante.numero_documento,
          correo_electronico: participante.correo_electronico,
          total_certificados: certificados.length,
          certificados: certificados.map(cert => {
            // 🆕 Buscar nombre override si existe
            const nombreOverride = cert.datos?.find(d => d.campo === '_nombre_override');
            const nombreMostrar = nombreOverride?.valor ||
              [participante.termino, participante.nombres].filter(Boolean).join(' ').trim();

            return {
              id: cert.id,
              codigo_validacion: cert.codigo || 'SIN-CODIGO',
              nombre_actual: nombreMostrar, // 🆕 Nombre que se muestra en el certificado
              nombre_original: [participante.termino, participante.nombres].filter(Boolean).join(' ').trim(), // 🆕 Nombre del participante
              tiene_override: !!nombreOverride, // 🆕 Indica si tiene nombre personalizado
              curso: cert.lote?.curso || 'Sin curso',
              tipo_documento: cert.lote?.tipo_documento || 'Certificado',
              fecha_emision: cert.fecha_emision,
              fecha_inicio: cert.fecha_inicio,
              fecha_fin: cert.fecha_fin,
              horas_academicas: cert.horas_academicas,
              ponente: cert.ponente,
              lote_id: cert.lote?.id,
              lote_nombre: cert.lote?.nombre,
              archivo_url: cert.archivo_url
            };
          })
        };
      })
    );

    return NextResponse.json({
      participantes: participantesConHistorial,
      total: participantesConHistorial.length
    });

  } catch (error) {
    console.error('Error al buscar participantes:', error);
    return NextResponse.json(
      { error: 'Error al buscar participantes' },
      { status: 500 }
    );
  }
}
