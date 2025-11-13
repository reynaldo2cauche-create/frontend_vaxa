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
    // Autenticación por cookies
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const usuarioId = request.cookies.get('usuario_id')?.value;
    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener empresa del usuario
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: { id: parseInt(usuarioId) },
      relations: ['empresa']
    });

    if (!usuario || !usuario.empresa) {
      return NextResponse.json(
        { success: false, error: 'Usuario o empresa no encontrada' },
        { status: 404 }
      );
    }

    const empresaId = usuario.empresa.id;

    const searchParams = request.nextUrl.searchParams;
    const termino = searchParams.get('termino'); // Búsqueda por nombre o DNI

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
      .where('p.empresa_id = :empresaId', { empresaId })
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

    // Si solo hay un participante, devolver directamente su información
    const participante = participantes[0];
    const certificadoRepo = AppDataSource.getRepository(Certificado);

    const certificados = await certificadoRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.lote', 'l')
      .leftJoinAndSelect('c.datos', 'd')
      .where('c.participante_id = :participanteId', { participanteId: participante.id })
      .orderBy('c.fecha_emision', 'DESC')
      .getMany();

    console.log(`🔍 Participante encontrado: ${participante.nombres} ${participante.apellidos}`);
    console.log(`📋 Certificados: ${certificados.length}`);

    const certificadosFormateados = certificados.map(cert => {
      const nombreOverride = cert.datos?.find(d => d.campo === '_nombre_override');
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
        nombre_actual: nombreOverride?.valor || nombreCompleto,
        tiene_override: !!nombreOverride,
        tipo_documento: cert.lote?.tipo_documento || 'Certificado',
        curso: cert.lote?.curso || 'Sin curso',
        fecha_emision: cert.fecha_emision,
        pdf_url: pdfUrl,
        lote_id: cert.lote?.id
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: participante.id,
        dni: participante.numero_documento,
        nombre: [participante.nombres, participante.apellidos].filter(Boolean).join(' '),
        email: participante.correo_electronico,
        telefono: participante.telefono || '',
        empresa_id: participante.empresa_id,
        certificados: certificadosFormateados
      }
    });

  } catch (error) {
    console.error('❌ Error al buscar participantes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar participantes' },
      { status: 500 }
    );
  }
}
