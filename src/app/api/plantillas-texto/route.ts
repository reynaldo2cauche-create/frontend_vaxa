// ============================================
// API: Obtener plantillas de texto predefinidas
// GET /api/plantillas-texto
// ============================================
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { PlantillaTexto } from '@/lib/entities/PlantillaTexto';

export async function GET() {
  try {
    const dataSource = await getDataSource();
    const plantillaTextoRepo = dataSource.getRepository(PlantillaTexto);

    const plantillas = await plantillaTextoRepo.find({
      where: { activo: true },
      order: { categoria: 'ASC', nombre: 'ASC' }
    });

    return NextResponse.json(plantillas);
  } catch (error) {
    console.error('Error al obtener plantillas de texto:', error);
    return NextResponse.json(
      { error: 'Error al cargar plantillas' },
      { status: 500 }
    );
  }
}
