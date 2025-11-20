// app/api/preview-excel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ExcelService } from '@/lib/services/ExcelService';

/**
 * POST /api/preview-excel
 * 
 * Recibe un archivo Excel y retorna un preview de las primeras filas
 * para que el usuario pueda verificar los datos antes de generar certificados
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      );
    }

    // 2. Validar el archivo usando el método del servicio
    const validacion = ExcelService.validarArchivo(file);
    
    if (!validacion.valido) {
      return NextResponse.json(
        { error: validacion.error },
        { status: 400 }
      );
    }

    // 3. Obtener preview (primeras 5 filas)
    const preview = await ExcelService.obtenerPreview(file, 5);

    // 4. Retornar el preview con información adicional
    return NextResponse.json({
      success: true,
      data: {
        filename: file.name,
        size: file.size,
        totalRows: preview.total_registros,
        columns: preview.columnas,
        previewRows: preview.filas,
        message: `Se encontraron ${preview.total_registros} registros en el archivo`
      }
    });

  } catch (error) {
    console.error('Error al procesar Excel:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al procesar el archivo Excel',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}