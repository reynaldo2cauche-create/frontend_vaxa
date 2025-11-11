// src/app/api/certificados/[certificadoId]/descargar/route.ts

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

    const dataSource = await getDataSource();
    const certRepo = dataSource.getRepository(Certificado);

    const certificado = await certRepo.findOne({
      where: { id: certificadoId },
      relations: ['participante']
    });

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Construir la ruta del archivo
    // certificado.archivo_url tiene formato: /generated/2/lote-65/VAXA-2-xxx.pdf
    const filePath = join(process.cwd(), 'public', certificado.archivo_url);

    try {
      const fileBuffer = await readFile(filePath);

      // Generar nombre de archivo amigable
      const participanteName = certificado.participante
        ? `${certificado.participante.nombres}_${certificado.participante.apellidos}`.replace(/\s+/g, '_')
        : certificado.codigo;
      
      const fileName = `Certificado_${participanteName}_${certificado.codigo}.pdf`;

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      });
    } catch (fileError) {
      console.error('Error al leer archivo:', fileError);
      return NextResponse.json(
        { error: 'Archivo no encontrado en el servidor' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ Error al descargar certificado:', error);
    return NextResponse.json(
      { error: 'Error al descargar certificado' },
      { status: 500 }
    );
  }
}