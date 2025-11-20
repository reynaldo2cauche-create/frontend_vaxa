// src/app/api/plantillas/subir/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PlantillaService } from '@/lib/services/PlantillaService';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('plantilla') as File;
    const empresaId = formData.get('empresaId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!empresaId) {
      return NextResponse.json(
        { error: 'No se proporcionó el ID de empresa' },
        { status: 400 }
      );
    }

    console.log(`📤 Subiendo plantilla para empresa ${empresaId}`);
    console.log(`📄 Archivo: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten PNG, JPG y WEBP' },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('🔄 Convirtiendo imagen a PNG válido...');

    // Convertir a PNG válido usando sharp para compatibilidad con canvas
    const pngBuffer = await sharp(buffer)
      .png({
        compressionLevel: 6,
        adaptiveFiltering: true,
        force: true
      })
      .toBuffer();

    // Obtener dimensiones
    const metadata = await sharp(pngBuffer).metadata();
    console.log('📏 Dimensiones:', metadata.width, 'x', metadata.height);

    // Validar dimensiones (opcional - con tolerancia)
    const validacion = PlantillaService.validarDimensionesFondo(
      metadata.width || 0,
      metadata.height || 0
    );

    if (!validacion.valido) {
      console.warn('⚠️ Advertencia de dimensiones:', validacion.mensaje);
      // No bloqueamos la subida, solo advertimos
    }

    // Guardar usando PlantillaService
    const rutaRelativa = await PlantillaService.guardarFondo(
      parseInt(empresaId),
      pngBuffer,
      file.name
    );

    console.log('✅ Plantilla guardada correctamente');

    return NextResponse.json({
      success: true,
      message: 'Plantilla subida correctamente',
      url: rutaRelativa,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      advertencia: validacion.valido ? null : validacion.mensaje
    });

  } catch (error) {
    console.error('❌ Error al subir plantilla:', error);
    return NextResponse.json(
      {
        error: `Error al procesar la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`
      },
      { status: 500 }
    );
  }
}