import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { DatoCertificado } from '@/lib/entities/DatoCertificado';
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

    const datoCertificadoRepo = AppDataSource.getRepository(DatoCertificado);

    // Buscar si ya existe un _nombre_override
    let datoNombreOverride = await datoCertificadoRepo.findOne({
      where: {
        certificado_id: certificadoId,
        campo: '_nombre_override'
      }
    });

    if (datoNombreOverride) {
      // Actualizar el existente
      datoNombreOverride.valor = nuevoNombre.trim();
      await datoCertificadoRepo.save(datoNombreOverride);
      console.log(`✏️ Nombre actualizado para certificado ${certificado.codigo}: "${nuevoNombre.trim()}"`);
    } else {
      // Crear nuevo _nombre_override
      datoNombreOverride = datoCertificadoRepo.create({
        certificado_id: certificadoId,
        campo: '_nombre_override',
        valor: nuevoNombre.trim()
      });
      await datoCertificadoRepo.save(datoNombreOverride);
      console.log(`📝 Nombre personalizado creado para certificado ${certificado.codigo}: "${nuevoNombre.trim()}"`);
    }

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