// src/app/api/logos/eliminar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Logo } from '@/lib/entities/Logo';
import fs from 'fs';
import path from 'path';

/**
 * DELETE /api/logos/eliminar
 * Elimina un logo de la empresa (soft delete)
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { logoId } = body;

    if (!logoId) {
      return NextResponse.json(
        { error: 'ID de logo requerido' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const logoRepo = ds.getRepository(Logo);

    // Buscar el logo
    const logo = await logoRepo.findOne({
      where: { id: logoId }
    });

    if (!logo) {
      return NextResponse.json(
        { error: 'Logo no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo
    logo.activo = 0;
    await logoRepo.save(logo);

    // Opcionalmente, eliminar el archivo físico
    try {
      const rutaCompleta = path.join(process.cwd(), 'public', logo.url);
      if (fs.existsSync(rutaCompleta)) {
        fs.unlinkSync(rutaCompleta);
        console.log(`🗑️ Archivo de logo eliminado: ${rutaCompleta}`);
      }
    } catch (error) {
      console.warn('No se pudo eliminar el archivo físico:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Logo eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar logo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar logo' },
      { status: 500 }
    );
  }
}
