// src/lib/services/PlantillaService.ts

import { getDataSource } from '../db';
import { Empresa } from '../entities/Empresa';
import { PlantillaConfig } from '../entities/PlantillaConfig';
import { CampoPlantilla } from '../entities/CampoPlantilla';
import { Logo } from '../entities/Logo';
import fs from 'fs';
import path from 'path';

/**
 * Servicio para gestión de plantillas
 */

export interface LogoEmpresa {
  posicion: 1 | 2 | 3;
  url: string;
  nombre: string;
}

export interface PlantillaBasica {
  fondo: string;
  logo?: string; // Logo antiguo (para compatibilidad)
  logos: LogoEmpresa[]; // Nuevo sistema de logos múltiples
}

export class PlantillaService {
  /**
   * ⭐ MÉTODO QUE FALTABA - Obtiene la configuración completa de la plantilla
   */
  static async obtenerConfig(empresaId: number): Promise<PlantillaConfig | null> {
    try {
      const dataSource = await getDataSource();
      const plantillaRepo = dataSource.getRepository(PlantillaConfig);

      const config = await plantillaRepo.findOne({
        where: { empresa_id: empresaId },
        relations: ['campos', 'bloques_texto']
      });

      return config;
    } catch (error) {
      console.error('Error al obtener configuración de plantilla:', error);
      return null;
    }
  }

  /**
   * ⭐ MÉTODO ADICIONAL - Obtiene los campos de la plantilla
   */
  static async obtenerCampos(empresaId: number): Promise<CampoPlantilla[]> {
    try {
      const dataSource = await getDataSource();
      const campoRepo = dataSource.getRepository(CampoPlantilla);

      const config = await PlantillaService.obtenerConfig(empresaId);
      
      if (!config) {
        return [];
      }

      const campos = await campoRepo.find({
        where: { plantilla_id: config.id },
        order: { orden: 'ASC' }
      });

      return campos;
    } catch (error) {
      console.error('Error al obtener campos:', error);
      return [];
    }
  }

  /**
   * Obtiene la plantilla básica de una empresa (fondo y logos)
   * IMPORTANTE: Retorna rutas RELATIVAS para que PDFService las procese correctamente
   */
  static async obtenerPlantillaBasica(empresaId: number): Promise<PlantillaBasica | null> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      const logoRepo = dataSource.getRepository(Logo);

      const empresa = await empresaRepo.findOne({
        where: { id: empresaId },
        relations: ['plantilla']
      });

      if (!empresa) {
        return null;
      }

      // Validar que existe el archivo de fondo
      if (!empresa.plantilla || !empresa.plantilla.imagen_fondo) {
        return null;
      }

      // Construir ruta absoluta para validar que existe
      const rutaFondoAbsoluta = path.join(process.cwd(), 'public', empresa.plantilla.imagen_fondo);

      if (!fs.existsSync(rutaFondoAbsoluta)) {
        console.error(`Fondo no encontrado: ${rutaFondoAbsoluta}`);
        return null;
      }

      // Logo antiguo (para compatibilidad) - OPCIONAL
      let rutaLogoRelativa: string | undefined;
      if (empresa.logo) {
        const rutaLogoAbsoluta = path.join(process.cwd(), 'public', empresa.logo);
        if (fs.existsSync(rutaLogoAbsoluta)) {
          rutaLogoRelativa = empresa.logo; // Usar ruta relativa desde /public
        }
      }

      // Obtener logos múltiples - OPCIONAL
      const logosActivos = await logoRepo.find({
        where: {
          empresaId: empresaId,
          activo: 1
        },
        order: {
          posicion: 'ASC'
        }
      });

      // Validar que los archivos de logos existen
      const logosValidos: LogoEmpresa[] = [];
      for (const logo of logosActivos) {
        const rutaLogoAbsoluta = path.join(process.cwd(), 'public', logo.url);
        if (fs.existsSync(rutaLogoAbsoluta)) {
          logosValidos.push({
            posicion: logo.posicion,
            url: logo.url,
            nombre: logo.nombre
          });
        } else {
          console.warn(`⚠️ Logo no encontrado: ${rutaLogoAbsoluta}`);
        }
      }

      console.log(`✅ Logos cargados para empresa ${empresaId}:`, logosValidos.length);

      // ✅ RETORNAR RUTAS RELATIVAS (desde /public) no absolutas
      return {
        fondo: empresa.plantilla.imagen_fondo, // Ej: /uploads/fondos/1/fondo-123.png
        logo: rutaLogoRelativa, // Logo antiguo (compatibilidad)
        logos: logosValidos // Logos múltiples (nuevo sistema)
      };
    } catch (error) {
      console.error('Error al obtener plantilla:', error);
      return null;
    }
  }

  /**
   * Guarda el fondo de plantilla para una empresa
   */
  static async guardarFondo(
    empresaId: number,
    archivoBuffer: Buffer,
    nombreOriginal: string
  ): Promise<string> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      const plantillaRepo = dataSource.getRepository(PlantillaConfig);
      
      const empresa = await empresaRepo.findOne({
        where: { id: empresaId },
        relations: ['plantilla']
      });

      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Crear directorio para fondos
      const dirFondos = path.join(process.cwd(), 'public', 'uploads', 'fondos', empresaId.toString());
      
      if (!fs.existsSync(dirFondos)) {
        fs.mkdirSync(dirFondos, { recursive: true });
      }

      // Generar nombre único
      const extension = path.extname(nombreOriginal);
      const nombreArchivo = `fondo-${Date.now()}${extension}`;
      const rutaCompleta = path.join(dirFondos, nombreArchivo);

      // Guardar archivo
      fs.writeFileSync(rutaCompleta, archivoBuffer);

      // Actualizar ruta en PlantillaConfig
      const rutaRelativa = `/uploads/fondos/${empresaId}/${nombreArchivo}`;

      if (empresa.plantilla) {
        // Actualizar plantilla existente
        empresa.plantilla.imagen_fondo = rutaRelativa;
        await plantillaRepo.save(empresa.plantilla);
      } else {
        // Crear nueva plantilla
        const nuevaPlantilla = plantillaRepo.create({
          empresa_id: empresaId,
          imagen_fondo: rutaRelativa
        });
        await plantillaRepo.save(nuevaPlantilla);
      }

      console.log(`✅ Fondo guardado para empresa ${empresaId}: ${rutaRelativa}`);

      return rutaRelativa;
    } catch (error) {
      console.error('Error al guardar fondo:', error);
      throw new Error('Error al guardar fondo de plantilla');
    }
  }

  /**
   * Guarda el logo de una empresa
   */
  static async guardarLogo(
    empresaId: number,
    archivoBuffer: Buffer,
    nombreOriginal: string
  ): Promise<string> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      
      const empresa = await empresaRepo.findOne({
        where: { id: empresaId }
      });

      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Crear directorio para logos
      const dirLogos = path.join(process.cwd(), 'public', 'uploads', 'logos', empresaId.toString());
      
      if (!fs.existsSync(dirLogos)) {
        fs.mkdirSync(dirLogos, { recursive: true });
      }

      // Generar nombre único
      const extension = path.extname(nombreOriginal);
      const nombreArchivo = `logo-${Date.now()}${extension}`;
      const rutaCompleta = path.join(dirLogos, nombreArchivo);

      // Guardar archivo
      fs.writeFileSync(rutaCompleta, archivoBuffer);

      // Actualizar ruta en la empresa
      const rutaRelativa = `/uploads/logos/${empresaId}/${nombreArchivo}`;
      empresa.logo = rutaRelativa;
      await empresaRepo.save(empresa);

      console.log(`✅ Logo guardado para empresa ${empresaId}: ${rutaRelativa}`);

      return rutaRelativa;
    } catch (error) {
      console.error('Error al guardar logo:', error);
      throw new Error('Error al guardar logo');
    }
  }

  /**
   * Elimina el fondo de una empresa
   */
  static async eliminarFondo(empresaId: number): Promise<boolean> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      const plantillaRepo = dataSource.getRepository(PlantillaConfig);

      const empresa = await empresaRepo.findOne({
        where: { id: empresaId },
        relations: ['plantilla']
      });

      if (!empresa || !empresa.plantilla || !empresa.plantilla.imagen_fondo) {
        return false;
      }

      // Eliminar archivo físico
      const rutaCompleta = path.join(process.cwd(), 'public', empresa.plantilla.imagen_fondo);
      if (fs.existsSync(rutaCompleta)) {
        fs.unlinkSync(rutaCompleta);
      }

      // Actualizar base de datos
      empresa.plantilla.imagen_fondo = '';
      await plantillaRepo.save(empresa.plantilla);

      console.log(`🗑️ Fondo eliminado para empresa ${empresaId}`);

      return true;
    } catch (error) {
      console.error('Error al eliminar fondo:', error);
      return false;
    }
  }

  /**
   * Elimina el logo de una empresa
   */
  static async eliminarLogo(empresaId: number): Promise<boolean> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      
      const empresa = await empresaRepo.findOne({
        where: { id: empresaId }
      });

      if (!empresa || !empresa.logo) {
        return false;
      }

      // Eliminar archivo físico
      const rutaCompleta = path.join(process.cwd(), 'public', empresa.logo);
      if (fs.existsSync(rutaCompleta)) {
        fs.unlinkSync(rutaCompleta);
      }

      // Actualizar base de datos
      empresa.logo = null;
      await empresaRepo.save(empresa);

      console.log(`🗑️ Logo eliminado para empresa ${empresaId}`);

      return true;
    } catch (error) {
      console.error('Error al eliminar logo:', error);
      return false;
    }
  }

  /**
   * Verifica si una empresa tiene plantilla configurada
   */
  static async tieneConfig(empresaId: number): Promise<boolean> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      
      const empresa = await empresaRepo.findOne({
        where: { id: empresaId },
        relations: ['plantilla']
      });

      return !!(empresa && empresa.plantilla && empresa.plantilla.imagen_fondo);
    } catch (error) {
      console.error('Error al verificar configuración:', error);
      return false;
    }
  }

  /**
   * Obtiene información de la plantilla para mostrar en UI
   */
  static async obtenerInfo(empresaId: number): Promise<{
    tieneFondo: boolean;
    tieneLogo: boolean;
    rutaFondo?: string;
    rutaLogo?: string;
  } | null> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      
      const empresa = await empresaRepo.findOne({
        where: { id: empresaId },
        relations: ['plantilla']
      });

      if (!empresa) {
        return null;
      }

      return {
        tieneFondo: !!(empresa.plantilla && empresa.plantilla.imagen_fondo),
        tieneLogo: !!empresa.logo,
        rutaFondo: empresa.plantilla?.imagen_fondo || undefined,
        rutaLogo: empresa.logo || undefined
      };
    } catch (error) {
      console.error('Error al obtener info de plantilla:', error);
      return null;
    }
  }

  /**
   * Valida que el fondo tenga el tamaño estándar requerido
   */
  static validarDimensionesFondo(ancho: number, alto: number): {
    valido: boolean;
    mensaje?: string;
  } {
    const ANCHO_ESTANDAR = 1920;
    const ALTO_ESTANDAR = 1357;
    const TOLERANCIA = 50;

    const diferenciaAncho = Math.abs(ancho - ANCHO_ESTANDAR);
    const diferenciaAlto = Math.abs(alto - ALTO_ESTANDAR);

    if (diferenciaAncho > TOLERANCIA || diferenciaAlto > TOLERANCIA) {
      return {
        valido: false,
        mensaje: `El fondo debe tener dimensiones ${ANCHO_ESTANDAR}x${ALTO_ESTANDAR}px (±${TOLERANCIA}px). Dimensiones actuales: ${ancho}x${alto}px`
      };
    }

    return { valido: true };
  }

  /**
   * Valida que el logo tenga dimensiones adecuadas
   */
  static validarDimensionesLogo(ancho: number, alto: number): {
    valido: boolean;
    mensaje?: string;
  } {
    const MAX_ANCHO = 300;
    const MAX_ALTO = 300;

    if (ancho > MAX_ANCHO || alto > MAX_ALTO) {
      return {
        valido: false,
        mensaje: `El logo no debe exceder ${MAX_ANCHO}x${MAX_ALTO}px. Dimensiones actuales: ${ancho}x${alto}px`
      };
    }

    return { valido: true };
  }

  /**
   * Obtiene la configuración de texto actual
   */
  static async obtenerTextoConfig(empresaId: number): Promise<{
    tipo: 'plantilla' | 'personalizado';
    plantillaTexto?: any;
    bloques?: any[];
  } | null> {
    try {
      const dataSource = await getDataSource();
      const empresaRepo = dataSource.getRepository(Empresa);
      const PlantillaTextoRepo = dataSource.getRepository('PlantillaTexto');

      const empresa = await empresaRepo.findOne({
        where: { id: empresaId },
        relations: ['plantilla']
      });

      if (!empresa?.plantilla) {
        return null;
      }

      // Si tiene plantilla_texto_id, usar plantilla predefinida
      if (empresa.plantilla.plantilla_texto_id) {
        const plantillaTexto = await PlantillaTextoRepo.findOne({
          where: { id: empresa.plantilla.plantilla_texto_id }
        });

        return {
          tipo: 'plantilla',
          plantillaTexto
        };
      }

      // Si tiene bloques_texto, usar personalizado
      if (empresa.plantilla.bloques_texto) {
        return {
          tipo: 'personalizado',
          bloques: Array.isArray(empresa.plantilla.bloques_texto) 
            ? empresa.plantilla.bloques_texto 
            : []
        };
      }

      return null;
    } catch (error) {
      console.error('Error al obtener texto config:', error);
      return null;
    }
  }

  /**
   * ⭐ MÉTODO NUEVO - Reemplaza variables en el texto del certificado
   * Reemplaza placeholders como {nombre}, {curso}, etc. con los valores reales
   */
  static generarTextoCertificado(
    plantilla: string,
    datos: { [campo: string]: string }
  ): string {
    let texto = plantilla;

    // Reemplazar cada variable {campo} con su valor
    Object.entries(datos).forEach(([campo, valor]) => {
      const regex = new RegExp(`\\{${campo}\\}`, 'gi');
      texto = texto.replace(regex, valor || '');
    });

    // Limpiar variables no reemplazadas (por si faltan datos)
    texto = texto.replace(/\{[^}]+\}/g, '___');

    return texto;
  }
}