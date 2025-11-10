// ============================================
// API: GET /api/certificados/[certificadoId]/descargar
// Descarga el PDF de un certificado individual
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificadoId: string } }
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

    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json({ error: 'ID de certificado inválido' }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);

    // Obtener certificado
    const certificado = await certificadoRepo.findOne({
      where: { id: certificadoId, empresa_id: decoded.empresa_id }
    });

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    if (!certificado.archivo_url) {
      return NextResponse.json(
        { error: 'El certificado no tiene archivo PDF asociado' },
        { status: 404 }
      );
    }

    // Verificar que el archivo existe
    const rutaPDF = path.join(process.cwd(), 'public', certificado.archivo_url);

    if (!fs.existsSync(rutaPDF)) {
      console.error(`❌ Archivo no encontrado: ${rutaPDF}`);
      return NextResponse.json(
        { error: 'Archivo PDF no encontrado en el servidor' },
        { status: 404 }
      );
    }

    console.log(`📥 Descargando certificado ${certificado.codigo} - ${rutaPDF}`);

    // Leer el archivo
    const fileBuffer = fs.readFileSync(rutaPDF);

    // Nombre del archivo para la descarga
    const nombreArchivo = `certificado-${certificado.codigo}.pdf`;

    // Retornar el archivo como descarga
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error al descargar certificado:', error);
    return NextResponse.json(
      { error: 'Error al descargar certificado' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
