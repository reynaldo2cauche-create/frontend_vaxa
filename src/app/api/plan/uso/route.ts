import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Empresa } from '@/lib/entities/Empresa';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la empresa' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    const empresa = await empresaRepo.findOne({
      where: { id: parseInt(empresaId) },
      select: ['id', 'nombre', 'certificados_emitidos', 'limite_plan']
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const uso = {
      empresa: empresa.nombre,
      certificados_emitidos: empresa.certificados_emitidos,
      limite_plan: empresa.limite_plan,
      disponibles: empresa.limite_plan - empresa.certificados_emitidos,
      porcentaje_uso: empresa.limite_plan > 0 
        ? Math.round((empresa.certificados_emitidos / empresa.limite_plan) * 100)
        : 0
    };

    return NextResponse.json({
      success: true,
      data: uso
    });

  } catch (error) {
    console.error('Error al obtener uso del plan:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresaId, accion, cantidad } = body;

    if (!empresaId || !accion) {
      return NextResponse.json(
        { error: 'Se requiere empresaId y accion' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const empresaRepo = dataSource.getRepository(Empresa);

    const empresa = await empresaRepo.findOne({
      where: { id: parseInt(empresaId) }
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    if (accion === 'incrementar') {
      // Verificar límite antes de incrementar
      if (empresa.certificados_emitidos >= empresa.limite_plan) {
        return NextResponse.json(
          { 
            error: 'Límite del plan alcanzado',
            disponibles: 0,
            emitidos: empresa.certificados_emitidos,
            limite: empresa.limite_plan
          },
          { status: 403 }
        );
      }

      empresa.certificados_emitidos += cantidad || 1;
      await empresaRepo.save(empresa);

      return NextResponse.json({
        success: true,
        data: {
          certificados_emitidos: empresa.certificados_emitidos,
          disponibles: empresa.limite_plan - empresa.certificados_emitidos
        }
      });
    }

    if (accion === 'actualizar_limite') {
      if (cantidad === undefined) {
        return NextResponse.json(
          { error: 'Se requiere cantidad para actualizar límite' },
          { status: 400 }
        );
      }

      empresa.limite_plan = cantidad;
      await empresaRepo.save(empresa);

      return NextResponse.json({
        success: true,
        data: {
          limite_plan: empresa.limite_plan,
          certificados_emitidos: empresa.certificados_emitidos,
          disponibles: empresa.limite_plan - empresa.certificados_emitidos
        }
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error al actualizar uso del plan:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Configuración para evitar caché en desarrollo
export const dynamic = 'force-dynamic';