// src/app/api/logos/subir/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Logo } from '@/lib/entities/Logo';
import { subirImagen } from '@/lib/uploads';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const file = formData.get('logo') as File;
    const empresaId = parseInt(formData.get('empresaId') as string);
    const posicion = parseInt(formData.get('posicion') as string) as 1 | 2 | 3; // ← FIX AQUÍ
    const nombre = formData.get('nombre') as string;

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (isNaN(empresaId) || isNaN(posicion)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Validar que la posición sea 1, 2 o 3
    if (![1, 2, 3].includes(posicion)) {
      return NextResponse.json(
        { error: 'La posición debe ser 1, 2 o 3' },
        { status: 400 }
      );
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo no debe superar los 2MB' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes PNG, JPG o WebP' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const logoRepo = ds.getRepository(Logo);

    // Verificar si ya existe un logo en esa posición
    const logoExistente = await logoRepo.findOne({
      where: {
        empresaId: empresaId,
        posicion: posicion,
        activo: 1
      }
    });

    // Convertir archivo a buffer y subir
    const buffer = Buffer.from(await file.arrayBuffer());
    const urlLogo = await subirImagen(buffer, `logos/empresa-${empresaId}`);

    let logo: Logo;

    if (logoExistente) {
      // Actualizar logo existente
      logoExistente.nombre = nombre;
      logoExistente.url = urlLogo;
      logoExistente.updatedAt = new Date();
      
      logo = await logoRepo.save(logoExistente);
    } else {
      // Crear nuevo logo
      const nuevoLogo = new Logo();
      nuevoLogo.empresaId = empresaId;
      nuevoLogo.nombre = nombre;
      nuevoLogo.url = urlLogo;
      nuevoLogo.posicion = posicion; // ← AHORA SÍ FUNCIONA
      nuevoLogo.activo = 1;
      nuevoLogo.createdAt = new Date();
      nuevoLogo.updatedAt = new Date();

      logo = await logoRepo.save(nuevoLogo);
    }

    console.log(`✅ Logo subido: ${urlLogo}`);

    return NextResponse.json({
      success: true,
      logo: {
        id: logo.id,
        nombre: logo.nombre,
        url: logo.url,
        posicion: logo.posicion
      }
    });
  } catch (error) {
    console.error('❌ Error al subir logo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir logo' },
      { status: 500 }
    );
  }
}