import { NextRequest, NextResponse } from 'next/server';
import { PlantillaService } from '@/lib/services/PlantillaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { empresaId: string } }
) {
  try {
    const empresaId = parseInt(params.empresaId);

    // Obtener información de la plantilla usando el servicio simplificado
    const info = await PlantillaService.obtenerInfo(empresaId);

    if (!info || !info.tieneFondo) {
      return NextResponse.json({
        plantilla: null,
        existe: false
      });
    }

    // Retornar la información de la plantilla
    return NextResponse.json({
      plantilla: {
        url: info.rutaFondo,
        existe: true,
        logo: info.rutaLogo
      }
    });

  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    return NextResponse.json(
      { error: 'Error al obtener la plantilla' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';