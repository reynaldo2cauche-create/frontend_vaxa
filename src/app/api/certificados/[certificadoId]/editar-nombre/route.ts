import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';

export async function PUT(
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

    const { nuevoNombre } = await req.json();

    if (!nuevoNombre || !nuevoNombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Verificar que el certificado existe
    const certificadoRepo = AppDataSource.getRepository(Certificado);
    const certificado = await certificadoRepo.findOne({
      where: { id: certificadoId }
    });

    if (!certificado) {
      return NextResponse.json(
        { success: false, error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // 🆕 Guardar en la columna nombre_override de la tabla certificados
    certificado.nombre_override = nuevoNombre.trim();
    await certificadoRepo.save(certificado);

    console.log(`✏️ Nombre personalizado guardado para certificado ${certificado.codigo}: "${nuevoNombre.trim()}"`);
    console.log(`   Antes: ${certificado.nombre_override || 'Sin nombre personalizado'}`);
    console.log(`   Ahora: ${nuevoNombre.trim()}`);

    return NextResponse.json({
      success: true,
      data: {
        certificadoId,
        codigo: certificado.codigo,
        nombreAnterior: certificado.curso_nombre, // O el que sea
        nombreNuevo: nuevoNombre.trim(),
        message: 'Nombre actualizado exitosamente. Regenera el certificado para ver los cambios.'
      }
    });

  } catch (error) {
    console.error('Error al editar nombre:', error);
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