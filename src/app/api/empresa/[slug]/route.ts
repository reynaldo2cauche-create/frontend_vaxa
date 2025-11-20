// ============================================
// 📁 app/api/empresa/[slug]/route.ts
// Obtener datos de empresa por slug
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Empresa } from '@/lib/entities/Empresa';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    const empresa = await empresaRepo.findOne({
      where: { slug: params.slug }
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Retornar solo datos públicos
    return NextResponse.json({
      id: empresa.id,
      slug: empresa.slug,
      nombre: empresa.nombre,
      logo: empresa.logo,
      color_primario: empresa.color_primario,
      color_secundario: empresa.color_secundario
    });

  } catch (error) {
    console.error('Error al obtener empresa:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
