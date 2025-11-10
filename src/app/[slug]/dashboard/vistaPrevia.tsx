'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react';

interface PlantillaTexto {
  id: number;
  titulo: string;
  cuerpo: string;
  pie: string | null;
}

interface Logo {
  id: number;
  url: string;
  posicion: 1 | 2 | 3;
}

interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  firmaUrl: string;
}

interface Props {
  empresaId: number;
  key?: number;
}

export default function VistaPrevia({ empresaId }: Props) {
  const [plantillaTexto, setPlantillaTexto] = useState<PlantillaTexto | null>(null);
  const [imagenFondo, setImagenFondo] = useState<string | null>(null);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [firmas, setFirmas] = useState<Firma[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(Date.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cargar datos solo al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [empresaId]);

  useEffect(() => {
    if (imagenFondo && canvasRef.current && plantillaTexto) {
      generarVistaPrevia();
    }
  }, [imagenFondo, plantillaTexto, logos, firmas]);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      // Cargar plantilla de imagen
      const plantillaResponse = await fetch(`/api/plantillas/${empresaId}`);

      if (!plantillaResponse.ok) {
        console.error('Error en API plantillas:', plantillaResponse.status);
        return;
      }

      const plantillaData = await plantillaResponse.json();

      // Construir URL completa si es relativa
      if (plantillaData.plantilla?.url && plantillaData.plantilla?.existe) {
        const urlCompleta = plantillaData.plantilla.url.startsWith('http')
          ? plantillaData.plantilla.url
          : `${window.location.origin}${plantillaData.plantilla.url}`;
        setImagenFondo(urlCompleta);
      }

      // Cargar textos configurados
      const textosResponse = await fetch(`/api/textos/${empresaId}`);

      if (textosResponse.ok) {
        const textosData = await textosResponse.json();

        if (textosData.textos && textosData.textos.length > 0) {
          const textoConfig = textosData.textos[0];
          setPlantillaTexto({
            id: textoConfig.id,
            titulo: textoConfig.titulo || 'CERTIFICADO DE RECONOCIMIENTO',
            cuerpo: textoConfig.cuerpo || 'Se otorga el presente certificado a {nombre}',
            pie: textoConfig.pie || 'Emitido el {fecha}'
          });
        } else {
          // Usar textos de ejemplo si no hay configurados
          setPlantillaTexto({
            id: 0,
            titulo: 'CERTIFICADO DE RECONOCIMIENTO',
            cuerpo: 'Se otorga el presente certificado a {nombre} identificado con {documento}, por haber completado satisfactoriamente el curso de {curso}.',
            pie: 'Emitido el {fecha}'
          });
        }
      } else {
        setPlantillaTexto({
          id: 0,
          titulo: 'CERTIFICADO DE RECONOCIMIENTO',
          cuerpo: 'Se otorga el presente certificado a {nombre} identificado con {documento}, por haber completado satisfactoriamente el curso de {curso}.',
          pie: 'Emitido el {fecha}'
        });
      }

      // Cargar logos
      try {
        const logosResponse = await fetch(`/api/logos/${empresaId}`);
        if (logosResponse.ok) {
          const logosData = await logosResponse.json();
          if (logosData.success && logosData.logos) {
            setLogos(logosData.logos);
          }
        }
      } catch (error) {
        console.error('Error al cargar logos:', error);
      }

      // Cargar firmas
      try {
        const firmasResponse = await fetch(`/api/firmas?empresaId=${empresaId}`);
        if (firmasResponse.ok) {
          const firmasData = await firmasResponse.json();
          if (firmasData.success && firmasData.data) {
            // Mostrar solo las primeras 3 firmas
            setFirmas(firmasData.data.slice(0, 3));
          }
        }
      } catch (error) {
        console.error('Error al cargar firmas:', error);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const generarVistaPrevia = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imagenFondo) {
      console.warn('❌ Falta canvas o imagen');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const width = canvas.width;
      const height = canvas.height;

      // Factor de escala basado en ancho estándar (1920px)
      const ANCHO_ESTANDAR = 1920;
      const factorEscala = width / ANCHO_ESTANDAR;

      // Función helper para escalar tamaños de fuente
      const escalarFuente = (baseSize: number) => {
        const scaled = Math.round(baseSize * factorEscala);
        return Math.max(10, Math.min(scaled, 120));
      };

      // Función para reemplazar variables con datos de ejemplo
      const reemplazarVariables = (texto: string): string => {
        return texto
          .replace(/\{nombre\}/gi, 'Juan Pérez García')
          .replace(/\{apellido\}/gi, 'Pérez García')
          .replace(/\{documento\}/gi, '12345678')
          .replace(/\{tipo_documento\}/gi, 'DNI')
          .replace(/\{curso\}/gi, 'Marketing Digital Avanzado')
          .replace(/\{fecha\}/gi, '15/03/2024')
          .replace(/\{ciudad\}/gi, 'Lima')
          .replace(/\{horas\}/gi, '40');
      };

      // Obtener textos configurados
      if (!plantillaTexto) {
        console.warn('No hay plantilla de texto configurada');
        return;
      }

      const titulo = plantillaTexto.titulo || 'CERTIFICADO';
      const cuerpo = plantillaTexto.cuerpo || 'Se otorga el presente certificado';
      const pie = plantillaTexto.pie || '';

      // TITULO (parte superior centro)
      ctx.font = `bold ${escalarFuente(28)}px Arial`;
      ctx.fillStyle = '#1a365d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(titulo.toUpperCase(), width * 0.50, height * 0.20);

      // NOMBRE (destacado)
      ctx.font = `bold ${escalarFuente(48)}px Georgia`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Juan Perez Garcia', width * 0.50, height * 0.35);

      // CUERPO - dividir en lineas y reemplazar variables
      const cuerpoConEjemplo = reemplazarVariables(cuerpo);
      const lineasCuerpo = wrapText(ctx, cuerpoConEjemplo, width * 0.75);

      ctx.font = `${escalarFuente(18)}px Arial`;
      ctx.fillStyle = '#475569';
      let yPos = height * 0.50;
      const lineHeight = escalarFuente(24);

      lineasCuerpo.forEach((linea, index) => {
        ctx.fillText(linea, width * 0.50, yPos + (index * lineHeight));
      });

      // PIE (si existe)
      if (pie && pie.trim()) {
        ctx.font = `${escalarFuente(16)}px Arial`;
        ctx.fillStyle = '#64748b';
        ctx.fillText(reemplazarVariables(pie), width * 0.50, height * 0.80);
      }

      // QR SIMULADO
      const qrSize = escalarFuente(180);
      const qrX = width * 0.86;
      const qrY = height * 0.77;

      ctx.fillStyle = '#333333';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${escalarFuente(16)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2);

      // CÓDIGO
      ctx.font = `${escalarFuente(14)}px monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('VAXA-1-1234567890-ABC123', width * 0.91, height * 0.93);

      // RENDERIZAR LOGOS
      const logoSize = escalarFuente(80);
      logos.forEach((logo) => {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          let x, y;
          if (logo.posicion === 1) {
            // Izquierda
            x = width * 0.05;
            y = height * 0.05;
          } else if (logo.posicion === 2) {
            // Derecha
            x = width * 0.90;
            y = height * 0.05;
          } else {
            // Centro
            x = width * 0.50 - logoSize / 2;
            y = height * 0.03;
          }
          ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        };
        logoImg.src = logo.url.startsWith('http') ? logo.url : `${window.location.origin}${logo.url}`;
      });

      // RENDERIZAR FIRMAS (al final del certificado)
      if (firmas.length > 0) {
        const firmaWidth = 150;
        const firmaHeight = 60;
        const gap = 60;
        const totalWidth = (firmaWidth * firmas.length) + (gap * (firmas.length - 1));
        const startX = (width - totalWidth) / 2;
        const yPos = height * 0.75;

        firmas.forEach((firma, index) => {
          const x = startX + (index * (firmaWidth + gap));

          // Cargar imagen de firma
          const firmaImg = new Image();
          firmaImg.crossOrigin = 'anonymous';
          firmaImg.onload = () => {
            // Imagen de firma
            ctx.drawImage(firmaImg, x, yPos, firmaWidth, firmaHeight);

            // Línea divisoria
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, yPos + firmaHeight + 8);
            ctx.lineTo(x + firmaWidth, yPos + firmaHeight + 8);
            ctx.stroke();

            // Nombre
            ctx.font = `bold ${escalarFuente(12)}px Arial`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(firma.nombre, x + firmaWidth / 2, yPos + firmaHeight + 25);

            // Cargo
            ctx.font = `italic ${escalarFuente(10)}px Arial`;
            ctx.fillStyle = '#64748b';
            ctx.fillText(firma.cargo, x + firmaWidth / 2, yPos + firmaHeight + 40);
          };
          firmaImg.src = firma.firmaUrl.startsWith('http')
            ? firma.firmaUrl
            : `${window.location.origin}${firma.firmaUrl}`;
        });
      }
    };

    img.onerror = (e) => {
      console.error('Error al cargar imagen:', imagenFondo);
    };

    img.src = imagenFondo;
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
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
    link.href = canvas.toDataURL();
    link.click();
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Cargando vista previa...</span>
      </div>
    );
  }

  if (!imagenFondo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <h3 className="font-semibold text-yellow-900">
            ⚠️ No se encontró la imagen
          </h3>
        </div>
        <p className="text-yellow-800">
          Verifica que tu API retorne correctamente <code>plantilla.url</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Vista Previa del Certificado</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Así se verá tu certificado con los textos configurados
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Actualizar vista previa"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={descargarPreview}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-semibold text-blue-900 mb-2">
          📌 Posicionamiento Automático
        </p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Título: Parte superior (25%)</li>
          <li>• Contenido: Centro (50%)</li>
          <li>• Pie: Parte inferior (80%)</li>
          <li>• QR y Código: Esquinas inferiores</li>
        </ul>
        <p className="text-sm text-blue-800 mt-3">
          ✅ Variables como {'{nombre}'}, {'{documento}'} se muestran con ejemplos
        </p>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <canvas ref={canvasRef} className="w-full h-auto border border-gray-300 rounded" />
      </div>
    </div>
  );
}