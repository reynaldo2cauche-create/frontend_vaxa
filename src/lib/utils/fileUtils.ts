// src/lib/utils/fileUtils.ts

import fs from 'fs';
import path from 'path';

/**
 * Utilidades para manejo de archivos
 */

// ===== DIRECTORIOS =====
export function asegurarDirectorio(rutaDirectorio: string): void {
  if (!fs.existsSync(rutaDirectorio)) {
    fs.mkdirSync(rutaDirectorio, { recursive: true });
  }
}

export function limpiarDirectorio(rutaDirectorio: string): void {
  if (fs.existsSync(rutaDirectorio)) {
    const archivos = fs.readdirSync(rutaDirectorio);
    archivos.forEach(archivo => {
      const rutaArchivo = path.join(rutaDirectorio, archivo);
      if (fs.lstatSync(rutaArchivo).isDirectory()) {
        limpiarDirectorio(rutaArchivo);
        fs.rmdirSync(rutaArchivo);
      } else {
        fs.unlinkSync(rutaArchivo);
      }
    });
  }
}

// ===== ARCHIVOS =====
export function eliminarArchivo(rutaArchivo: string): boolean {
  try {
    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
}

export function archivoExiste(rutaArchivo: string): boolean {
  return fs.existsSync(rutaArchivo);
}

export function obtenerTamañoArchivo(rutaArchivo: string): number {
  try {
    const stats = fs.statSync(rutaArchivo);
    return stats.size;
  } catch {
    return 0;
  }
}

export function formatearTamaño(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

// ===== PATHS =====
export function obtenerExtension(nombreArchivo: string): string {
  return path.extname(nombreArchivo).toLowerCase();
}

export function obtenerNombreSinExtension(nombreArchivo: string): string {
  return path.basename(nombreArchivo, path.extname(nombreArchivo));
}

export function generarNombreUnico(nombreBase: string, extension: string): string {
  const timestamp = Date.now();
  return `${nombreBase}-${timestamp}${extension}`;
}

// ===== LIMPIEZA AUTOMÁTICA =====
export function limpiarArchivosViejos(
  directorio: string,
  diasMaximos: number = 7
): number {
  let archivosEliminados = 0;

  if (!fs.existsSync(directorio)) {
    return 0;
  }

  const ahora = Date.now();
  const maxTiempo = diasMaximos * 24 * 60 * 60 * 1000; // días a milisegundos

  const archivos = fs.readdirSync(directorio);

  archivos.forEach(archivo => {
    const rutaArchivo = path.join(directorio, archivo);
    const stats = fs.statSync(rutaArchivo);

    if (stats.isFile()) {
      const tiempoArchivo = stats.mtime.getTime();
      const edad = ahora - tiempoArchivo;

      if (edad > maxTiempo) {
        try {
          fs.unlinkSync(rutaArchivo);
          archivosEliminados++;
        } catch (error) {
          console.error(`Error al eliminar ${archivo}:`, error);
        }
      }
    }
  });

  return archivosEliminados;
}

// ===== CONVERSIÓN =====
export async function base64ToBuffer(base64: string): Promise<Buffer> {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export function bufferToBase64(buffer: Buffer, mimetype: string = 'image/png'): string {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
}

// ===== RUTAS PÚBLICAS =====
export function obtenerRutaPublica(rutaRelativa: string): string {
  return path.join(process.cwd(), 'public', rutaRelativa);
}

export function obtenerURLPublica(rutaArchivo: string): string {
  // Convertir ruta del sistema a URL pública
  const rutaRelativa = rutaArchivo.replace(
    path.join(process.cwd(), 'public'),
    ''
  ).replace(/\\/g, '/');

  return rutaRelativa.startsWith('/') ? rutaRelativa : `/${rutaRelativa}`;
}

// ===== VALIDACIÓN DE RUTAS =====
export function esRutaSegura(rutaArchivo: string, directorioBase: string): boolean {
  const rutaNormalizada = path.normalize(rutaArchivo);
  const baseNormalizada = path.normalize(directorioBase);
  return rutaNormalizada.startsWith(baseNormalizada);
}

// ===== ESTADÍSTICAS =====
export function obtenerEstadisticasDirectorio(directorio: string): {
  total_archivos: number;
  tamaño_total: number;
  tamaño_formateado: string;
} {
  let totalArchivos = 0;
  let tamañoTotal = 0;

  if (!fs.existsSync(directorio)) {
    return {
      total_archivos: 0,
      tamaño_total: 0,
      tamaño_formateado: '0 Bytes'
    };
  }

  function recorrer(dir: string) {
    const archivos = fs.readdirSync(dir);

    archivos.forEach(archivo => {
      const rutaCompleta = path.join(dir, archivo);
      const stats = fs.statSync(rutaCompleta);

      if (stats.isDirectory()) {
        recorrer(rutaCompleta);
      } else {
        totalArchivos++;
        tamañoTotal += stats.size;
      }
    });
  }

  recorrer(directorio);

  return {
    total_archivos: totalArchivos,
    tamaño_total: tamañoTotal,
    tamaño_formateado: formatearTamaño(tamañoTotal)
  };
}

// ===== BACKUP =====
export function copiarArchivo(origen: string, destino: string): boolean {
  try {
    const dirDestino = path.dirname(destino);
    asegurarDirectorio(dirDestino);
    fs.copyFileSync(origen, destino);
    return true;
  } catch (error) {
    console.error('Error al copiar archivo:', error);
    return false;
  }
}

export function moverArchivo(origen: string, destino: string): boolean {
  try {
    const dirDestino = path.dirname(destino);
    asegurarDirectorio(dirDestino);
    fs.renameSync(origen, destino);
    return true;
  } catch (error) {
    console.error('Error al mover archivo:', error);
    return false;
  }
}