// scripts/configurar-campos-plantilla.ts
// Script para configurar campos por defecto en plantillas sin configuración

import 'reflect-metadata';
import { AppDataSource } from '../src/lib/db';
import { Empresa } from '../src/lib/entities/Empresa';
import { PlantillaConfig } from '../src/lib/entities/PlantillaConfig';
import { CampoPlantilla } from '../src/lib/entities/CampoPlantilla';
import { existsSync } from 'fs';
import path from 'path';
import { CanvasService } from '../src/lib/services/CanvasService';

async function configurarCamposPorDefecto() {
  try {
    console.log('🚀 Iniciando configuración de campos por defecto...\n');

    // Inicializar conexión a BD
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Conexión a BD establecida\n');
    }

    const empresaRepo = AppDataSource.getRepository(Empresa);
    const plantillaRepo = AppDataSource.getRepository(PlantillaConfig);
    const campoRepo = AppDataSource.getRepository(CampoPlantilla);

    // Obtener todas las empresas
    const empresas = await empresaRepo.find();
    console.log(`📋 Encontradas ${empresas.length} empresas\n`);

    for (const empresa of empresas) {
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
        console.log(`  ⚠️  No tiene plantilla subida, saltando...`);
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
          imagen_fondo: templatePath,
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
      } else {
        console.log(`  ✓  Ya tiene configuración base`);
      }

      // Verificar si tiene campos configurados
      const camposExistentes = await campoRepo.find({
        where: { plantilla_id: plantilla.id }
      });

      if (camposExistentes.length > 0) {
        console.log(`  ✓  Ya tiene ${camposExistentes.length} campos configurados`);
        continue;
      }

      // Crear campos por defecto
      console.log(`  ➕ Creando campos por defecto...`);

      const camposPorDefecto = [
        {
          nombre_campo: 'nombre',
          label: 'Nombre Completo',
          x: dimensions.width / 2,
          y: dimensions.height * 0.45,
          font_size: 48,
          font_family: 'Arial',
          font_color: '#000000',
          orden: 1,
          requerido: true
        },
        {
          nombre_campo: 'documento',
          label: 'DNI/Documento',
          x: dimensions.width / 2,
          y: dimensions.height * 0.60,
          font_size: 24,
          font_family: 'Arial',
          font_color: '#333333',
          orden: 2,
          requerido: true
        },
        {
          nombre_campo: 'curso',
          label: 'Nombre del Curso',
          x: dimensions.width / 2,
          y: dimensions.height * 0.30,
          font_size: 32,
          font_family: 'Arial',
          font_color: '#1a1a1a',
          orden: 3,
          requerido: true
        },
        {
          nombre_campo: 'fecha',
          label: 'Fecha de Emisión',
          x: dimensions.width / 2,
          y: dimensions.height * 0.75,
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
    }

    console.log('\n\n✅ ¡Configuración completada exitosamente!');
    console.log('\nResumen:');
    console.log(`  - Total empresas procesadas: ${empresas.length}`);

    const plantillasConCampos = await plantillaRepo
      .createQueryBuilder('plantilla')
      .leftJoin('plantilla.campos', 'campo')
      .select('plantilla.empresa_id')
      .addSelect('COUNT(campo.id)', 'total_campos')
      .groupBy('plantilla.empresa_id')
      .getRawMany();

    console.log(`  - Plantillas con campos configurados: ${plantillasConCampos.length}`);

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Ejecutar script
configurarCamposPorDefecto();
