// ============================================
// API: GET /api/validar?codigo=VAXA-XXX
// Validación pública de certificados
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const codigo = searchParams.get('codigo');

    if (!codigo || !codigo.trim()) {
      return NextResponse.json(
        { error: 'Código de certificado es requerido' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);

    // Buscar certificado con todas sus relaciones
    const certificado = await certificadoRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participante', 'p')
      .leftJoinAndSelect('c.lote', 'l')
      .leftJoinAndSelect('l.empresa', 'e')
      .leftJoinAndSelect('c.datos', 'd')
      .where('c.codigo = :codigo', { codigo: codigo.trim() })
      .getOne();

    if (!certificado) {
      return NextResponse.json({
        valido: false,
        mensaje: 'Certificado no encontrado. Verifica que el código sea correcto.'
      });
    }

    // 🆕 Obtener el nombre que se muestra en el certificado
    // Prioridad: _nombre_override > nombre del participante
    const nombreOverride = certificado.datos?.find(d => d.campo === 'nombre_override');
    const nombreCertificado = nombreOverride?.valor ||
      [ certificado.participante?.nombres]
        .filter(Boolean)
        .join(' ')
        .trim();

    // Verificar estado
    const esRevocado = certificado.estado === 'revocado';

    // Construir respuesta
    return NextResponse.json({
      valido: !esRevocado,
      estado: certificado.estado,
      mensaje: esRevocado
        ? '⚠️ Este certificado ha sido revocado y ya no es válido'
        : '✅ Certificado válido y activo',
      certificado: {
        codigo: certificado.codigo,
        nombre_certificado: nombreCertificado, // 🆕 Nombre que aparece en el PDF
        curso: certificado.lote?.curso || certificado.curso_nombre || 'Sin curso',
        tipo_documento: certificado.lote?.tipo_documento || 'Certificado',
        fecha_emision: certificado.fecha_emision,
      
        empresa: {
          nombre: certificado.lote?.empresa?.nombre || 'Sin empresa',
          logo: certificado.lote?.empresa?.logo || null
        },
        archivo_url: certificado.archivo_url
      }
    });

  } catch (error) {
    console.error('Error al validar certificado:', error);
    return NextResponse.json(
      {
        error: 'Error al validar certificado',
        mensaje: 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.'
      },
      { status: 500 }
    );
  }
}
