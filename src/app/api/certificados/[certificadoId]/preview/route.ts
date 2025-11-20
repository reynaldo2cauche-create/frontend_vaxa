// src/app/api/certificados/[certificadoId]/preview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json(
        { error: 'ID de certificado inválido' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    
    // Obtener solo el certificado con su archivo_url
    const certRepo = dataSource.getRepository(Certificado);
    const certificado = await certRepo.findOne({
      where: { id: certificadoId }
    });

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que existe archivo_url
    if (!certificado.archivo_url) {
      return NextResponse.json(
        { error: 'El certificado no tiene archivo PDF generado' },
        { status: 404 }
      );
    }

    // Construir la ruta del archivo PDF existente
    // certificado.archivo_url tiene formato: /generated/2/lote-65/VAXA-2-xxx.pdf
    const filePath = join(process.cwd(), 'public', certificado.archivo_url);

    try {
      const fileBuffer = await readFile(filePath);

      // Devolver PDF para previsualización (inline)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline', // Mostrar en el navegador
          'Content-Length': fileBuffer.length.toString()
        }
      });
    } catch (fileError) {
      console.error('Error al leer archivo PDF existente:', fileError);
      return NextResponse.json(
        { error: 'Archivo PDF no encontrado en el servidor' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ Error al obtener previsualización:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener la previsualización del certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}