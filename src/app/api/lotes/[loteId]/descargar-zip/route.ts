// ============================================
// API: GET /api/lotes/[loteId]/descargar-zip
// Genera ZIP bajo demanda y lo descarga directamente al navegador
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { verifyToken } from '@/lib/auth';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

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

    // Obtener todos los certificados del lote
    const certificados = await certificadoRepo.find({
      where: { lote_id: loteId, empresa_id: decoded.empresa_id },
      order: { id: 'ASC' }
    });

    if (certificados.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron certificados para este lote' },
        { status: 404 }
      );
    }

    console.log(`🔄 Generando ZIP bajo demanda para lote ${loteId} (${certificados.length} certificados)`);

    // Crear ZIP en memoria
    const zip = new AdmZip();

    // Agregar cada certificado al ZIP
    for (const cert of certificados) {
      if (cert.archivo_url) {
        const rutaPDF = path.join(process.cwd(), 'public', cert.archivo_url);

        if (fs.existsSync(rutaPDF)) {
          const pdfBuffer = fs.readFileSync(rutaPDF);
          const nombreArchivo = `certificado-${cert.codigo}.pdf`;
          zip.addFile(nombreArchivo, pdfBuffer);
          console.log(`   ✅ Agregado: ${nombreArchivo}`);
        } else {
          console.warn(`   ⚠️  PDF no encontrado: ${rutaPDF}`);
        }
      }
    }

    // Generar el buffer del ZIP
    const zipBuffer = zip.toBuffer();

    console.log(`✅ ZIP generado con ${certificados.length} certificados (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Retornar el ZIP directamente como descarga
    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="certificados-lote-${loteId}.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error al generar ZIP:', error);
    return NextResponse.json(
      { error: 'Error al generar archivo ZIP' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
