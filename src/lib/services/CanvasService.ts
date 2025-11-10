// src/lib/services/CanvasService.ts

import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import fs from 'fs';

/**
 * Servicio para generación de imágenes de certificados
 * Usa POSICIONES FIJAS para todos los certificados
 */

interface DatosEstandarizados {
  titulo: string;
  nombre: string;
  curso: string;
  fecha: string;
  horas: string;
  textoCompletado: string;
}

interface LogoConfig {
  url: string;
  posicion: 1 | 2 | 3;
}

interface ConfigEstandar {
  LOGO: { x: number; y: number; width: number; height: number };
  LOGO_DERECHA: { x: number; y: number; width: number; height: number };
  LOGO_CENTRO: { x: number; y: number; width: number; height: number };
  TITULO: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
  NOMBRE: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
  TEXTO_COMPLETADO: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
  CURSO: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
  FECHA: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
  HORAS: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
  QR: { x: number; y: number; baseSize: number };
  CODIGO: { x: number; y: number; baseSize: number; fontFamily: string; fontWeight: string; color: string; align: CanvasTextAlign };
}

interface ParametrosGeneracion {
  plantillaFondo: string;
  logoEmpresa?: string; // Logo antiguo (compatibilidad)
  logos?: LogoConfig[]; // Logos múltiples (nuevo sistema)
  ancho: number;
  alto: number;
  datos: DatosEstandarizados;
  codigo: string;
  qrDataURL: string;
  config: ConfigEstandar;
  outputPath: string;
}

export class CanvasService {
  /**
   * Genera un certificado con posiciones relativas (porcentajes)
   * Funciona con cualquier tamaño de plantilla
   */
  static async generarCertificadoEstandar(params: ParametrosGeneracion): Promise<void> {
    const {
      plantillaFondo,
      logoEmpresa,
      logos,
      ancho,
      alto,
      datos,
      codigo,
      qrDataURL,
      config,
      outputPath
    } = params;

    try {
      // 1. Crear canvas
      const canvas = createCanvas(ancho, alto);
      const ctx = canvas.getContext('2d');

      // 2. Cargar y dibujar fondo
      const imagenFondo = await loadImage(plantillaFondo);
      ctx.drawImage(imagenFondo, 0, 0, ancho, alto);

      // 3. Dibujar logo de la empresa (compatibilidad con logo antiguo)
      if (logoEmpresa) {
        try {
          const imagenLogo = await loadImage(logoEmpresa);
          const logoX = config.LOGO.x * ancho;
          const logoY = config.LOGO.y * alto;
          const logoWidth = config.LOGO.width * ancho;
          const logoHeight = config.LOGO.height * alto;

          ctx.drawImage(imagenLogo, logoX, logoY, logoWidth, logoHeight);
        } catch (error) {
          console.warn('No se pudo cargar el logo de la empresa:', error);
        }
      }

      // 3b. Dibujar logos múltiples (nuevo sistema)
      if (logos && logos.length > 0) {
        for (const logo of logos) {
          try {
            const imagenLogo = await loadImage(logo.url);
            let logoConfig;

            // Seleccionar configuración según posición
            if (logo.posicion === 1) {
              logoConfig = config.LOGO; // Izquierda
            } else if (logo.posicion === 2) {
              logoConfig = config.LOGO_DERECHA; // Derecha
            } else if (logo.posicion === 3) {
              logoConfig = config.LOGO_CENTRO; // Centro
            }

            if (logoConfig) {
              const logoX = logoConfig.x * ancho;
              const logoY = logoConfig.y * alto;
              const logoWidth = logoConfig.width * ancho;
              const logoHeight = logoConfig.height * alto;

              ctx.drawImage(imagenLogo, logoX, logoY, logoWidth, logoHeight);
              console.log(`✅ Logo posición ${logo.posicion} dibujado en (${logoX}, ${logoY})`);
            }
          } catch (error) {
            console.warn(`No se pudo cargar el logo posición ${logo.posicion}:`, error);
          }
        }
      }

      // 4. Dibujar título
      this.dibujarTextoRelativo(ctx, datos.titulo, config.TITULO, ancho, alto);

      // 5. Dibujar nombre (elemento principal)
      this.dibujarTextoRelativo(ctx, datos.nombre, config.NOMBRE, ancho, alto);

      // 6. Dibujar texto "Por haber completado"
      this.dibujarTextoRelativo(ctx, datos.textoCompletado, config.TEXTO_COMPLETADO, ancho, alto);

      // 7. Dibujar nombre del curso
      this.dibujarTextoRelativo(ctx, datos.curso, config.CURSO, ancho, alto);

      // 8. Dibujar fecha
      this.dibujarTextoRelativo(ctx, `Fecha: ${datos.fecha}`, config.FECHA, ancho, alto);

      // 9. Dibujar horas (si existen)
      if (datos.horas) {
        this.dibujarTextoRelativo(ctx, `Duración: ${datos.horas} horas`, config.HORAS, ancho, alto);
      }

      // 10. Dibujar código QR con escalado
      const imagenQR = await loadImage(qrDataURL);
      const qrX = config.QR.x * ancho;
      const qrY = config.QR.y * alto;

      // Escalar el QR basándose en el ancho de la plantilla
      const ANCHO_ESTANDAR = 1920;
      const factorEscala = ancho / ANCHO_ESTANDAR;
      const qrSize = Math.round(config.QR.baseSize * factorEscala);

      ctx.drawImage(imagenQR, qrX, qrY, qrSize, qrSize);

      // 11. Dibujar código del certificado
      this.dibujarTextoRelativo(ctx, codigo, config.CODIGO, ancho, alto);

      // 12. Guardar imagen
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Certificado generado: ${outputPath}`);
    } catch (error) {
      console.error('Error al generar imagen del certificado:', error);
      throw new Error('Error al generar imagen del certificado');
    }
  }

  /**
   * Dibuja texto con posiciones relativas y escalado inteligente
   * El tamaño de fuente se escala basándose en el ancho de la plantilla
   */
  private static dibujarTextoRelativo(
    ctx: CanvasRenderingContext2D,
    texto: string,
    config: {
      x: number;
      y: number;
      baseSize: number;
      fontFamily: string;
      fontWeight: string;
      color: string;
      align: CanvasTextAlign;
    },
    ancho: number,
    alto: number
  ): void {
    // Calcular posición real basada en porcentajes
    const x = config.x * ancho;
    const y = config.y * alto;

    // Calcular factor de escala basado en el ANCHO de la plantilla
    // Esto mantiene las fuentes proporcionadas independientemente del tamaño
    const ANCHO_ESTANDAR = 1920;
    const factorEscala = ancho / ANCHO_ESTANDAR;

    // Aplicar escala al tamaño base, con límites razonables
    const fontSize = Math.round(config.baseSize * factorEscala);

    // Límites para evitar fuentes extremadamente grandes o pequeñas
    const fontSizeFinal = Math.max(10, Math.min(fontSize, 120));

    // Construir la fuente completa
    const font = `${config.fontWeight} ${fontSizeFinal}px ${config.fontFamily}`;

    ctx.font = font;
    ctx.fillStyle = config.color;
    ctx.textAlign = config.align;
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, x, y);
  }

  /**
   * Dibuja texto con la configuración especificada (método antiguo - por compatibilidad)
   */
  private static dibujarTexto(
    ctx: CanvasRenderingContext2D,
    texto: string,
    config: {
      x: number;
      y: number;
      font: string;
      color: string;
      align: CanvasTextAlign;
    }
  ): void {
    ctx.font = config.font;
    ctx.fillStyle = config.color;
    ctx.textAlign = config.align;
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, config.x, config.y);
  }

  /**
   * Dibuja texto con sombra (para mayor legibilidad)
   */
  private static dibujarTextoConSombra(
    ctx: CanvasRenderingContext2D,
    texto: string,
    config: {
      x: number;
      y: number;
      font: string;
      color: string;
      align: CanvasTextAlign;
    }
  ): void {
    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    this.dibujarTexto(ctx, texto, config);

    // Resetear sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Dibuja texto multilínea (para textos largos)
   */
  private static dibujarTextoMultilinea(
    ctx: CanvasRenderingContext2D,
    texto: string,
    config: {
      x: number;
      y: number;
      font: string;
      color: string;
      align: CanvasTextAlign;
      maxWidth: number;
      lineHeight: number;
    }
  ): void {
    ctx.font = config.font;
    ctx.fillStyle = config.color;
    ctx.textAlign = config.align;
    ctx.textBaseline = 'middle';

    const palabras = texto.split(' ');
    let linea = '';
    let yActual = config.y;

    for (let i = 0; i < palabras.length; i++) {
      const pruebaLinea = linea + palabras[i] + ' ';
      const medida = ctx.measureText(pruebaLinea);

      if (medida.width > config.maxWidth && i > 0) {
        ctx.fillText(linea, config.x, yActual);
        linea = palabras[i] + ' ';
        yActual += config.lineHeight;
      } else {
        linea = pruebaLinea;
      }
    }
    ctx.fillText(linea, config.x, yActual);
  }

  /**
   * Genera una vista previa del certificado (miniatura)
   */
  static async generarPreview(
    plantillaFondo: string,
    ancho: number = 600,
    alto: number = 424
  ): Promise<Buffer> {
    try {
      const canvas = createCanvas(ancho, alto);
      const ctx = canvas.getContext('2d');

      const imagenFondo = await loadImage(plantillaFondo);
      ctx.drawImage(imagenFondo, 0, 0, ancho, alto);

      // Agregar marca de agua "PREVIEW"
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(ancho / 2, alto / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText('PREVIEW', 0, 0);
      ctx.restore();

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('Error al generar preview:', error);
      throw new Error('Error al generar preview');
    }
  }

  /**
   * Valida que una imagen tenga las dimensiones correctas
   */
  static async validarDimensiones(
    rutaImagen: string,
    anchoEsperado: number,
    altoEsperado: number,
    tolerancia: number = 50
  ): Promise<{ valido: boolean; mensaje?: string }> {
    try {
      const imagen = await loadImage(rutaImagen);

      const diferenciaAncho = Math.abs(imagen.width - anchoEsperado);
      const diferenciaAlto = Math.abs(imagen.height - altoEsperado);

      if (diferenciaAncho > tolerancia || diferenciaAlto > tolerancia) {
        return {
          valido: false,
          mensaje: `La imagen debe tener dimensiones ${anchoEsperado}x${altoEsperado}px (±${tolerancia}px). Dimensiones actuales: ${imagen.width}x${imagen.height}px`
        };
      }

      return { valido: true };
    } catch (error) {
      return {
        valido: false,
        mensaje: 'No se pudo cargar la imagen'
      };
    }
  }

  /**
   * Redimensiona una imagen al tamaño estándar
   */
  static async redimensionarImagen(
    rutaOrigen: string,
    rutaDestino: string,
    ancho: number,
    alto: number
  ): Promise<void> {
    try {
      const imagenOriginal = await loadImage(rutaOrigen);
      const canvas = createCanvas(ancho, alto);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(imagenOriginal, 0, 0, ancho, alto);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(rutaDestino, buffer);

      console.log(`✅ Imagen redimensionada a ${ancho}x${alto}px`);
    } catch (error) {
      console.error('Error al redimensionar imagen:', error);
      throw new Error('Error al redimensionar imagen');
    }
  }
}