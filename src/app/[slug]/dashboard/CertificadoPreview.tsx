'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Logo } from '@/lib/entities/Logo';

function convertirFechaExcel(valor: any): string {
  if (!valor) return '';
  if (typeof valor === 'string' && valor.includes('/')) return valor;
  
  if (typeof valor === 'number') {
    const fechaExcel = XLSX.SSF.parse_date_code(valor);
    if (fechaExcel) {
      const dia = String(fechaExcel.d).padStart(2, '0');
      const mes = String(fechaExcel.m).padStart(2, '0');
      const anio = fechaExcel.y;
      return `${dia}/${mes}/${anio}`;
    }
  }
  
  if (valor instanceof Date) {
    const dia = String(valor.getDate()).padStart(2, '0');
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const anio = valor.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  
  return String(valor);
}

function convertirHoras(valor: any): number {
  if (typeof valor === 'number') return Math.round(valor);
  if (typeof valor === 'string') return parseInt(valor) || 0;
  return 0;
}

interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  url: string;
}

interface Props {
  plantillaUrl: string | null;
  datosParticipante: any;
  textoEstatico: string;
  firmas: Firma[];
  logos?: Logo[];
  tipoDocumento?: string;
  curso?: string;
}

export default function CertificadoPreview({
  plantillaUrl,
  datosParticipante,
  textoEstatico,
  firmas,
  logos = [],
  tipoDocumento = '',
  curso = ''
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plantillaUrl && datosParticipante) {
      generarPreview();
    }
  }, [plantillaUrl, datosParticipante, textoEstatico, firmas, logos, tipoDocumento, curso]);

  const generarPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !plantillaUrl) {
      setError('No se puede generar el preview sin plantilla');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('No se pudo obtener el contexto del canvas');
        setCargando(false);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const width = canvas.width;
        const height = canvas.height;

        const ANCHO_ESTANDAR_A4 = 1122;
        const factorEscala = width / ANCHO_ESTANDAR_A4;

        const escalarFuente = (baseSize: number) => {
          const scaled = Math.round(baseSize * factorEscala);
          return Math.max(8, Math.min(scaled, 500));
        };

        const paddingTop = 40 * factorEscala;
        const paddingSides = 60 * factorEscala;

        // LOGOS - MÁS GRANDES
        if (logos && logos.length > 0) {
          const logosActivos = logos.filter(l => l.activo === undefined || l.activo === 1);
          
          if (logosActivos.length > 0) {
            const logoSize = Math.round(140 * factorEscala); // TAMAÑO AJUSTADO
            const logoY = paddingTop - 60; // Más arriba

            const logosOrdenados = [...logosActivos].sort((a, b) => a.posicion - b.posicion);

            const calcularPosicionX = (index: number, total: number): number => {
              if (total === 1) {
                return (width / 2) - (logoSize / 2);
              } else if (total === 2) {
                if (index === 0) return paddingSides + 50;
                return width - paddingSides - logoSize - 50;
              } else {
                if (index === 0) return paddingSides + 50;
                if (index === 1) return (width / 2) - (logoSize / 2);
                return width - paddingSides - logoSize - 50;
              }
            };

            for (let i = 0; i < logosOrdenados.length; i++) {
              const logo = logosOrdenados[i];
              
              try {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                
                await new Promise<void>((resolve, reject) => {
                  logoImg.onload = () => resolve();
                  logoImg.onerror = () => reject();
                  logoImg.src = logo.url;
                });

                const logoX = calcularPosicionX(i, logosOrdenados.length);
                
                const aspectRatio = logoImg.width / logoImg.height;
                let drawWidth = logoSize;
                let drawHeight = logoSize;
                
                if (aspectRatio > 1) {
                  drawHeight = logoSize / aspectRatio;
                } else if (aspectRatio < 1) {
                  drawWidth = logoSize * aspectRatio;
                }
                
                const offsetX = (logoSize - drawWidth) / 2;
                const offsetY = (logoSize - drawHeight) / 2;

                ctx.drawImage(logoImg, logoX + offsetX, logoY + offsetY, drawWidth, drawHeight);
                
                console.log(`✅ Logo ${logo.nombre} dibujado - Tamaño: ${drawWidth}x${drawHeight}`);
              } catch (error) {
                console.warn(`⚠️ No se pudo cargar logo: ${logo.nombre}`, error);
              }
            }
          }
        }

        // TÍTULO
        const tituloMostrar = tipoDocumento || datosParticipante['Tipo de Documento'] || 'CERTIFICADO DE PARTICIPACIÓN';
        ctx.font = `bold ${escalarFuente(32)}px Arial`;
        ctx.fillStyle = '#1a365d';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const tituloY = paddingTop + (height * 0.15);
        ctx.fillText(tituloMostrar.toUpperCase(), width * 0.50, tituloY);

        // NOMBRE DEL PARTICIPANTE
        const nombreCompleto = `${datosParticipante['Término'] || ''} ${datosParticipante['Nombres'] || ''} ${datosParticipante['Apellidos'] || ''}`.trim();
        ctx.font = `bold ${escalarFuente(48)}px Georgia`;
        ctx.fillStyle = '#0f172a';
        ctx.textBaseline = 'middle';
        const nombreY = height * 0.35;
        ctx.fillText(nombreCompleto, width * 0.50, nombreY);

        // TEXTO ESTÁTICO
        if (textoEstatico && textoEstatico.trim()) {
          // Limitar texto a máximo 300 caracteres
          const MAX_CARACTERES = 300;
          let textoLimitado = textoEstatico;
          if (textoEstatico.length > MAX_CARACTERES) {
            textoLimitado = textoEstatico.substring(0, MAX_CARACTERES) + '...';
          }

          const maxWidthTexto = width - (paddingSides * 4);
          // Reducir tamaño de fuente si el texto es largo
          const fontSize = textoLimitado.length > 200 ? 16 : 18;
          const lineasCuerpo = wrapText(ctx, textoLimitado, maxWidthTexto, escalarFuente(fontSize));

          // Limitar número de líneas a 4-5 máximo
          const maxLineas = textoLimitado.length > 200 ? 5 : 4;
          const lineasVisibles = lineasCuerpo.slice(0, maxLineas);

          ctx.font = `${escalarFuente(fontSize)}px Arial`;
          ctx.fillStyle = '#475569';
          ctx.textAlign = 'center';
          let yPos = height * 0.45;
          const lineHeight = escalarFuente(fontSize === 16 ? 22 : 26);

          lineasVisibles.forEach((linea) => {
            ctx.fillText(linea, width * 0.50, yPos);
            yPos += lineHeight;
          });
        }

        // NOMBRE DEL CURSO
        const cursoMostrar = curso || datosParticipante['Nombre del Curso'] || '';
        if (cursoMostrar) {
          ctx.font = `italic ${escalarFuente(24)}px Georgia`;
          ctx.fillStyle = '#344c99ff';
          ctx.textAlign = 'center';
          const cursoY = height * 0.60;
          ctx.fillText(`"${cursoMostrar}"`, width * 0.50, cursoY);
        }

        // FECHA Y HORAS
        ctx.font = `${escalarFuente(16)}px Arial`;
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const datosY = height - (paddingTop * 4.5);

        const fechaEmision = convertirFechaExcel(datosParticipante['Fecha de Emisión']);
        ctx.fillText(`Fecha: ${fechaEmision}`, paddingSides, datosY);

        if (datosParticipante['Horas Académicas']) {
          const horas = convertirHoras(datosParticipante['Horas Académicas']);
          ctx.fillText(`Duración: ${horas} horas`, paddingSides, datosY + escalarFuente(20));
        }

        // QR
        const qrSize = escalarFuente(100);
        const qrX = width - paddingSides - qrSize - (paddingSides * 0.5);
        const qrY = height - paddingTop - qrSize - (paddingTop * 2);

        ctx.fillStyle = '#333333';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${escalarFuente(14)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2);

        ctx.font = `${escalarFuente(10)}px monospace`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('VAXA-X-XXXXXXX-XXXX', qrX + qrSize/2, qrY + qrSize + escalarFuente(8));

        // FIRMAS
        if (firmas && firmas.length > 0) {
          const firmasY = height - (paddingTop * 3);
          const firmasStartX = paddingSides;
          const firmasEndX = width - paddingSides - qrSize - (paddingSides * 2);
          const firmasWidth = firmasEndX - firmasStartX;
          const gap = escalarFuente(30);
          const totalGaps = gap * (firmas.length - 1);
          const firmaWidth = (firmasWidth - totalGaps) / firmas.length;

          for (let index = 0; index < firmas.length; index++) {
            const firma = firmas[index];
            const firmaX = firmasStartX + (index * (firmaWidth + gap)) + (firmaWidth / 2);

            if (firma.url) {
              try {
                const firmaImg = new Image();
                firmaImg.crossOrigin = 'anonymous';
                
                await new Promise<void>((resolve, reject) => {
                  firmaImg.onload = () => resolve();
                  firmaImg.onerror = () => reject();
                  firmaImg.src = firma.url;
                });

                const firmaImgWidth = escalarFuente(120);
                const firmaImgHeight = escalarFuente(40);
                const firmaImgX = firmaX - (firmaImgWidth / 2);
                const firmaImgY = firmasY - firmaImgHeight - escalarFuente(10);
                
                ctx.drawImage(firmaImg, firmaImgX, firmaImgY, firmaImgWidth, firmaImgHeight);
              } catch (error) {
                console.warn(`⚠️ No se pudo cargar firma: ${firma.nombre}`, error);
              }
            }

            const lineWidth = Math.min(firmaWidth * 0.8, escalarFuente(150));
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(firmaX - lineWidth/2, firmasY);
            ctx.lineTo(firmaX + lineWidth/2, firmasY);
            ctx.stroke();

            ctx.font = `bold ${escalarFuente(12)}px Arial`;
            ctx.fillStyle = '#1a1a1a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(firma.nombre, firmaX, firmasY + escalarFuente(5));

            ctx.font = `${escalarFuente(10)}px Arial`;
            ctx.fillStyle = '#666666';
            ctx.fillText(firma.cargo, firmaX, firmasY + escalarFuente(20));
          }
        }

        // FOOTER
        ctx.font = `${escalarFuente(11)}px Arial`;
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Certificado generado por VAXA - Sistema de Certificación', width * 0.50, height - escalarFuente(15));

        setCargando(false);
      };

      img.onerror = () => {
        setError('Error al cargar la imagen de plantilla');
        setCargando(false);
      };

      img.src = plantillaUrl;

    } catch (error) {
      console.error('Error al generar preview:', error);
      setError('Error al generar la vista previa');
      setCargando(false);
    }
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] => {
    ctx.font = `${fontSize}px Arial`;
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
  };

  const descargarPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'preview-certificado.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!plantillaUrl) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
        <p className="text-yellow-800 font-semibold mb-2">
          ⚠️ No se ha cargado la plantilla de fondo
        </p>
        <p className="text-sm text-yellow-700">
          Asegúrate de haber completado el Paso 2: Subir Plantilla
        </p>
      </div>
    );
  }

  const logosActivos = logos.filter(l => l.activo === 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-gray-800">📄 Vista previa del certificado:</h5>
        <button
          onClick={descargarPreview}
          disabled={cargando || !!error}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Download className="w-4 h-4" />
          Descargar Preview
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        {cargando && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Generando preview...</p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ display: cargando ? 'none' : 'block' }}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          ℹ️ Esta es una representación exacta de cómo se verá el certificado final en PDF
        </p>
      </div>

    
    </div>
  );
}