// src/lib/services/AutoLayoutService.ts

/**
 * Servicio de posicionamiento automático para certificados
 * Calcula las posiciones automáticamente basándose en el tamaño de la imagen
 */

export interface AutoLayoutConfig {
  width: number;
  height: number;
}

export interface LayoutPositions {
  titulo: {
    x: number;
    y: number;
    size: number;
    align: 'center';
    color: string;
    font: string;
    weight: 'bold';
  };
  cuerpo: {
    x: number;
    y: number;
    size: number;
    align: 'center';
    color: string;
    font: string;
    maxWidth: number;
    lineHeight: number;
  };
  pie: {
    x: number;
    y: number;
    size: number;
    align: 'center';
    color: string;
    font: string;
    style: 'italic';
  };
  qr: {
    x: number;
    y: number;
    size: number;
  };
  codigo: {
    x: number;
    y: number;
    size: number;
    align: 'left';
    color: string;
  };
}

export class AutoLayoutService {
  /**
   * Calcula automáticamente las posiciones de todos los elementos
   * basándose en el tamaño de la imagen del certificado
   */
  static calcularPosiciones(config: AutoLayoutConfig): LayoutPositions {
    const { width, height } = config;
    const centerX = width / 2;

    // Calcular tamaños de fuente basados en dimensiones
    const tituloSize = Math.max(32, Math.min(72, width / 15)); // Entre 32 y 72px
    const cuerpoSize = Math.max(18, Math.min(32, width / 30)); // Entre 18 y 32px
    const pieSize = Math.max(14, Math.min(24, width / 40)); // Entre 14 y 24px
    const codigoSize = Math.max(10, Math.min(16, width / 60)); // Entre 10 y 16px
    const qrSize = Math.max(100, Math.min(150, width / 6)); // Entre 100 y 150px

    return {
      // TÍTULO - Parte superior (25% desde arriba)
      titulo: {
        x: centerX,
        y: height * 0.25,
        size: tituloSize,
        align: 'center',
        color: '#000000',
        font: 'Arial',
        weight: 'bold'
      },

      // CUERPO - Centro (50% desde arriba)
      cuerpo: {
        x: centerX,
        y: height * 0.5,
        size: cuerpoSize,
        align: 'center',
        color: '#000000',
        font: 'Arial',
        maxWidth: width * 0.8, // 80% del ancho
        lineHeight: cuerpoSize * 1.5 // 1.5 veces el tamaño de fuente
      },

      // PIE - Parte inferior (80% desde arriba)
      pie: {
        x: centerX,
        y: height * 0.8,
        size: pieSize,
        align: 'center',
        color: '#666666',
        font: 'Arial',
        style: 'italic'
      },

      // QR - Esquina inferior derecha
      qr: {
        x: width - qrSize - 30, // 30px de margen
        y: height - qrSize - 30,
        size: qrSize
      },

      // CÓDIGO - Esquina inferior izquierda
      codigo: {
        x: 30,
        y: height - 30,
        size: codigoSize,
        align: 'left',
        color: '#666666'
      }
    };
  }

  /**
   * Reemplaza las variables en el texto con los datos reales o de ejemplo
   */
  static reemplazarVariables(
    texto: string,
    datos?: { [key: string]: string }
  ): string {
    if (!datos) {
      // Datos de ejemplo para vista previa
      return texto
        .replace(/{nombre}/g, 'Juan Carlos')
        .replace(/{apellido}/g, 'Pérez Torres')
        .replace(/{documento}/g, '72345678')
        .replace(/{tipo_documento}/g, 'DNI')
        .replace(/{numero_documento}/g, '72345678')
        .replace(/{curso}/g, 'Marketing Digital Avanzado')
        .replace(/{fecha}/g, '15/03/2024')
        .replace(/{fecha_inicio}/g, '01/02/2024')
        .replace(/{fecha_fin}/g, '15/03/2024')
        .replace(/{horas}/g, '120')
        .replace(/{ciudad}/g, 'Lima')
        .replace(/{evento}/g, 'Conferencia Anual')
        .replace(/{cargo}/g, 'Analista')
        .replace(/{dia}/g, '15')
        .replace(/{mes}/g, 'marzo')
        .replace(/{anio}/g, '2024');
    }

    // Reemplazar con datos reales
    let resultado = texto;
    Object.entries(datos).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      resultado = resultado.replace(regex, value);
    });

    return resultado;
  }

  /**
   * Divide un texto en múltiples líneas para que quepa en el ancho máximo
   */
  static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.trim());
    }

    return lines;
  }
}
