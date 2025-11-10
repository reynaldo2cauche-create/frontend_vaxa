// app/api/setup/configurar-campos/route.ts
// API para configurar campos por defecto en plantillas sin configuración

import { NextResponse } from 'next/server';
import { AppDataSource, getDataSource } from '@/lib/db';
import { Empresa } from '@/lib/entities/Empresa';
import { PlantillaConfig } from '@/lib/entities/PlantillaConfig';
import { CampoPlantilla } from '@/lib/entities/CampoPlantilla';
import { existsSync } from 'fs';
import path from 'path';
import { CanvasService } from '@/lib/services/CanvasService';

export async function POST() {
  try {
    console.log('🚀 Iniciando configuración de campos por defecto...\n');

    // Obtener DataSource
    const dataSource = await getDataSource();

    const empresaRepo = dataSource.getRepository(Empresa);
    const plantillaRepo = dataSource.getRepository(PlantillaConfig);
    const campoRepo = dataSource.getRepository(CampoPlantilla);

    // Obtener todas las empresas
    const empresas = await empresaRepo.find();
    console.log(`📋 Encontradas ${empresas.length} empresas\n`);

    const resultados = [];

    for (const empresa of empresas) {
      const resultado: any = {
        empresaId: empresa.id,
        nombre: empresa.nombre,
        status: 'skipped',
        mensaje: ''
      };

      console.log(`\n🏢 Procesando empresa: ${empresa.nombre} (ID: ${empresa.id})`);

      // Verificar si existe la imagen de plantilla
      const templatePath = path.join(
        process.cwd(),
        'public',
        'certificados',
        empresa.id.toString(),
        'template.png'
      );

      if (!existsSync(templatePath)) {
        resultado.mensaje = 'No tiene plantilla subida';
        console.log(`  ⚠️  ${resultado.mensaje}`);
        resultados.push(resultado);
        continue;
      }

      // Verificar si ya tiene configuración
      let plantilla = await plantillaRepo.findOne({
        where: { empresa_id: empresa.id }
      });

      // Obtener dimensiones de la plantilla
      // const canvasService = new CanvasService();
      // const dimensions = await canvasService.obtenerDimensiones(templatePath);
      // console.log(`  📐 Dimensiones: ${dimensions.width}x${dimensions.height}px`);

      // Usar dimensiones por defecto (1920x1080)
      const dimensions = { width: 1920, height: 1080 };

      if (!plantilla) {
        // Crear configuración por defecto
        console.log(`  ➕ Creando configuración por defecto...`);

        plantilla = plantillaRepo.create({
          empresa_id: empresa.id,
          imagen_fondo: `/certificados/${empresa.id}/template.png`,
          qr_x: dimensions.width - 150,
          qr_y: dimensions.height - 150,
          qr_size: 120,
          codigo_x: 50,
          codigo_y: dimensions.height - 30,
          codigo_size: 14,
          codigo_color: '#666666'
        });

        await plantillaRepo.save(plantilla);
        console.log(`  ✅ Configuración creada`);
        resultado.status = 'config_created';
      }

      // Verificar si tiene campos configurados
      const camposExistentes = await campoRepo.find({
        where: { plantilla_id: plantilla.id }
      });

      if (camposExistentes.length > 0) {
        resultado.mensaje = `Ya tiene ${camposExistentes.length} campos configurados`;
        console.log(`  ✓  ${resultado.mensaje}`);
        resultados.push(resultado);
        continue;
      }

      // Crear campos por defecto
      console.log(`  ➕ Creando campos por defecto...`);

      const camposPorDefecto = [
        {
          nombre_campo: 'nombre',
          label: 'Nombre Completo',
          x: Math.round(dimensions.width / 2),
          y: Math.round(dimensions.height * 0.45),
          font_size: 48,
          font_family: 'Arial',
          font_color: '#000000',
          orden: 1,
          requerido: true
        },
        {
          nombre_campo: 'documento',
          label: 'DNI/Documento',
          x: Math.round(dimensions.width / 2),
          y: Math.round(dimensions.height * 0.60),
          font_size: 24,
          font_family: 'Arial',
          font_color: '#333333',
          orden: 2,
          requerido: true
        },
        {
          nombre_campo: 'curso',
          label: 'Nombre del Curso',
          x: Math.round(dimensions.width / 2),
          y: Math.round(dimensions.height * 0.30),
          font_size: 32,
          font_family: 'Arial',
          font_color: '#1a1a1a',
          orden: 3,
          requerido: true
        },
        {
          nombre_campo: 'fecha',
          label: 'Fecha de Emisión',
          x: Math.round(dimensions.width / 2),
          y: Math.round(dimensions.height * 0.75),
          font_size: 20,
          font_family: 'Arial',
          font_color: '#555555',
          orden: 4,
          requerido: false
        }
      ];

      const campos = camposPorDefecto.map(campoData =>
        campoRepo.create({
          ...campoData,
          plantilla_id: plantilla!.id
        })
      );

      await campoRepo.save(campos);
      console.log(`  ✅ ${campos.length} campos creados`);
      console.log(`     - ${campos.map(c => c.nombre_campo).join(', ')}`);

      resultado.status = 'success';
      resultado.mensaje = `${campos.length} campos creados`;
      resultado.campos = campos.map(c => c.nombre_campo);
      resultados.push(resultado);
    }

    return NextResponse.json({
      success: true,
      message: '✅ Configuración completada',
      totalEmpresas: empresas.length,
      resultados
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Error al configurar campos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos
