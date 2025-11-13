import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { DatoCertificado } from '@/lib/entities/DatoCertificado';
import { Certificado } from '@/lib/entities/Certificado';

export async function GET(
  req: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const certificadoRepo = AppDataSource.getRepository(Certificado);
    const datoCertificadoRepo = AppDataSource.getRepository(DatoCertificado);

    const certificado = await certificadoRepo.findOne({
      where: { id: certificadoId }
    });

    if (!certificado) {
      return NextResponse.json(
        { success: false, error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Buscar nombre actual
    const datos = await datoCertificadoRepo.find({
      where: { certificado_id: certificadoId }
    });

    // Priorizar _nombre_override
    const nombreOverride = datos.find(d => d.campo === '_nombre_override');
    const nombreOriginal = datos.find(d => d.campo === 'nombre');

    const nombreActual = nombreOverride?.valor || nombreOriginal?.valor || 'Sin nombre';

    return NextResponse.json({
      success: true,
      data: {
        certificadoId,
        codigo: certificado.codigo,
        nombreActual,
        tieneOverride: !!nombreOverride,
        nombreOriginal: nombreOriginal?.valor || null
      }
    });

  } catch (error) {
    console.error('Error al obtener nombre:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener nombre' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';