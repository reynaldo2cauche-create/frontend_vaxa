// src/lib/services/QRService.ts

import QRCode from 'qrcode';

/**
 * Servicio para generar códigos QR
 * Responsabilidades:
 * - Generar QR como Data URL (base64)
 * - Generar QR como buffer
 * - Configurar opciones de QR
 */

export interface OpcionesQR {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class QRService {
  /**
   * Genera un código QR como Data URL (base64)
   * Este formato se puede usar directamente en canvas
   */
  static async generarQRDataURL(
    url: string,
    opciones?: OpcionesQR
  ): Promise<string> {
    try {
      const opcionesDefault: OpcionesQR = {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...opciones
      };

      const dataURL = await QRCode.toDataURL(url, opcionesDefault);
      return dataURL;
    } catch (error) {
      console.error('Error al generar QR:', error);
      throw new Error('Error al generar código QR');
    }
  }

  /**
   * Genera un código QR como buffer PNG
   * Útil para guardar directamente como archivo
   */
  static async generarQRBuffer(
    url: string,
    opciones?: OpcionesQR
  ): Promise<Buffer> {
    try {
      const opcionesDefault: OpcionesQR = {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        ...opciones
      };

      const buffer = await QRCode.toBuffer(url, opcionesDefault);
      return buffer;
    } catch (error) {
      console.error('Error al generar QR buffer:', error);
      throw new Error('Error al generar código QR');
    }
  }

  /**
   * Genera la URL completa para validación de certificado
   */
  static generarURLValidacion(codigo: string, baseURL?: string): string {
    const base = baseURL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${base}/validar/${codigo}`;
  }

  /**
   * Valida que una URL sea válida para QR
   */
  static validarURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Genera QR para un código de certificado específico
   * Método helper que combina la generación de URL y QR
   */
  static async generarQRParaCertificado(
    codigo: string,
    size: number = 300,
    baseURL?: string
  ): Promise<string> {
    const url = this.generarURLValidacion(codigo, baseURL);
    
    return await this.generarQRDataURL(url, {
      width: size,
      errorCorrectionLevel: 'H', // Alta corrección de errores para certificados
      margin: 2
    });
  }
}