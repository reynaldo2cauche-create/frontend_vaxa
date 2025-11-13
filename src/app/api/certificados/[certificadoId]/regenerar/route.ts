import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { CertificadoService } from '@/lib/services/CertificadoService';

export async function POST(
  req: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json(
        { success: false, error: 'ID de certificado inválido' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log(`🔄 Solicitud de regeneración para certificado ${certificadoId}`);

    const certificadoRegenerado = await CertificadoService.regenerarCertificado(certificadoId);

    return NextResponse.json({
      success: true,
      data: {
        codigo: certificadoRegenerado.codigo,
        nombreCompleto: certificadoRegenerado.nombreCompleto,
        rutaArchivo: certificadoRegenerado.rutaArchivo,
        message: 'Certificado regenerado exitosamente'
      }
    });

  } catch (error) {
    console.error('Error al regenerar certificado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';