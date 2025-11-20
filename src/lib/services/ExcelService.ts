// src/lib/services/ExcelService.ts

import * as XLSX from 'xlsx';

/**
 * Servicio para manejar operaciones con archivos Excel
 * Responsabilidades:
 * - Leer archivos Excel
 * - Validar estructura de datos
 * - Obtener previews
 * - Normalizar datos
 */

export interface ExcelRow {
  [key: string]: string | number | null;
}

export interface ExcelPreview {
  columnas: string[];
  filas: ExcelRow[];
  total_registros: number;
}

export interface ExcelData {
  datos: any[];
  columnas: string[];
  total: number;
}

export class ExcelService {
  /**
   * Lee un archivo Excel completo y retorna todos los datos
   */
  static async leerExcel(file: File): Promise<ExcelData> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Obtener primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Mantener como strings
        defval: null // Valores por defecto como null
      }) as ExcelRow[];

      if (jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      // Obtener columnas del primer registro
      const columnas = Object.keys(jsonData[0]);

      // Normalizar datos
      const datosNormalizados = this.normalizarDatos(jsonData);

      return {
        datos: datosNormalizados,
        columnas,
        total: datosNormalizados.length
      };
    } catch (error) {
      console.error('Error al leer Excel:', error);
      throw new Error('Error al procesar el archivo Excel. Verifica que sea un archivo válido.');
    }
  }

  /**
   * Obtiene un preview de las primeras N filas del Excel
   */
  static async obtenerPreview(file: File, limit: number = 5): Promise<ExcelPreview> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: null
      }) as ExcelRow[];

      if (jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      const columnas = Object.keys(jsonData[0]);
      const filas = this.normalizarDatos(jsonData.slice(0, limit));

      return {
        columnas,
        filas,
        total_registros: jsonData.length
      };
    } catch (error) {
      console.error('Error al obtener preview:', error);
      throw new Error('Error al procesar el archivo Excel');
    }
  }

  /**
   * Valida que las columnas requeridas existan en el Excel
   */
  static validarColumnas(columnas: string[], columnasRequeridas: string[]): {
    valido: boolean;
    faltantes: string[];
  } {
    const faltantes = columnasRequeridas.filter(
      requerida => !columnas.some(col => 
        this.normalizarTexto(col) === this.normalizarTexto(requerida)
      )
    );

    return {
      valido: faltantes.length === 0,
      faltantes
    };
  }

  /**
   * Normaliza los datos del Excel:
   * - Limpia espacios en blanco
   * - Convierte a strings los números
   * - Estandariza formato
   */
  static normalizarDatos(datos: ExcelRow[]): ExcelRow[] {
    return datos.map(fila => {
      const filaNormalizada: ExcelRow = {};

      Object.keys(fila).forEach(key => {
        const keyLimpia = key.trim();
        let valor = fila[key];

        // Convertir a string y limpiar
        if (valor !== null && valor !== undefined) {
          valor = String(valor).trim();
        }

        filaNormalizada[keyLimpia] = valor;
      });

      return filaNormalizada;
    });
  }

  /**
   * Normaliza texto para comparaciones (quita espacios, lowercase, sin acentos)
   */
  static normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
  }

  /**
   * Mapea columnas del Excel a campos de certificado
   * Sugiere mapeo automático basado en nombres similares
   */
  static sugerirMapeo(columnasExcel: string[], camposRequeridos: string[]): Map<string, string> {
    const mapeo = new Map<string, string>();

    camposRequeridos.forEach(campo => {
      const campoNormalizado = this.normalizarTexto(campo);

      // Buscar coincidencia exacta
      const coincidenciaExacta = columnasExcel.find(col => 
        this.normalizarTexto(col) === campoNormalizado
      );

      if (coincidenciaExacta) {
        mapeo.set(campo, coincidenciaExacta);
        return;
      }

      // Buscar coincidencia parcial
      const coincidenciaParcial = columnasExcel.find(col => 
        this.normalizarTexto(col).includes(campoNormalizado) ||
        campoNormalizado.includes(this.normalizarTexto(col))
      );

      if (coincidenciaParcial) {
        mapeo.set(campo, coincidenciaParcial);
      }
    });

    return mapeo;
  }

  /**
   * Valida que un archivo sea Excel válido
   */
  static validarArchivo(file: File): { valido: boolean; error?: string } {
    // Validar extensión
    const extensionesValidas = ['.xlsx', '.xls'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!extensionesValidas.includes(extension)) {
      return {
        valido: false,
        error: 'El archivo debe ser formato Excel (.xlsx o .xls)'
      };
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valido: false,
        error: 'El archivo no debe superar los 10MB'
      };
    }

    // Validar tipo MIME
    const mimeTypesValidos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!mimeTypesValidos.includes(file.type)) {
      return {
        valido: false,
        error: 'Tipo de archivo no válido'
      };
    }

    return { valido: true };
  }
}