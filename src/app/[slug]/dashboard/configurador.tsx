'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Save,
  Eye,
  Move,
  Type,
  Palette,
  Undo,
  Check,
  AlertCircle
} from 'lucide-react';

interface Campo {
  id: number;
  nombre_campo: string;
  label: string;
  x: number;
  y: number;
  font_size: number;
  font_family: string;
  font_color: string;
  requerido: boolean;
}

interface Props {
  empresaId: number;
  plantillaUrl: string;
  onGuardado?: () => void;
}

export default function ConfiguradorPlantilla({ empresaId, plantillaUrl, onGuardado }: Props) {
  const [campos, setCampos] = useState<Campo[]>([]);
  const [campoSeleccionado, setCampoSeleccionado] = useState<number | null>(null);
  const [dimensiones, setDimensiones] = useState({ ancho: 800, alto: 600 });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [qrConfig, setQrConfig] = useState({ x: 650, y: 450, size: 120 });
  const [codigoConfig, setCodigoConfig] = useState({ x: 50, y: 570, size: 14, color: '#666666' });
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fuentes = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Helvetica'];

  // Cargar configuración actual
  useEffect(() => {
    cargarConfiguracion();
  }, [empresaId]);

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch(`/api/plantillas/${empresaId}`);
      const data = await response.json();

      if (data.campos && data.campos.length > 0) {
        setCampos(data.campos.map((c: any, idx: number) => ({
          id: idx + 1,
          nombre_campo: c.nombre,
          label: c.label,
          x: 400, // Centro por defecto
          y: 300,
          font_size: 32,
          font_family: 'Arial',
          font_color: '#000000',
          requerido: c.requerido
        })));
      } else {
        // Campos por defecto si no hay configuración
        setCampos([
          { id: 1, nombre_campo: 'curso', label: 'Nombre del Curso', x: 400, y: 150, font_size: 36, font_family: 'Georgia', font_color: '#1a1a1a', requerido: true },
          { id: 2, nombre_campo: 'nombre', label: 'Nombre Completo', x: 400, y: 280, font_size: 48, font_family: 'Arial', font_color: '#000000', requerido: true },
          { id: 3, nombre_campo: 'documento', label: 'DNI/Documento', x: 400, y: 370, font_size: 20, font_family: 'Arial', font_color: '#555555', requerido: true },
          { id: 4, nombre_campo: 'fecha', label: 'Fecha de Emisión', x: 400, y: 450, font_size: 18, font_family: 'Arial', font_color: '#666666', requerido: false }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const handleImageLoad = () => {
    if (imgRef.current) {
      setDimensiones({
        ancho: imgRef.current.naturalWidth,
        alto: imgRef.current.naturalHeight
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || campoSeleccionado === null) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = dimensiones.ancho / rect.width;
    const scaleY = dimensiones.alto / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setCampos(campos.map(campo =>
      campo.id === campoSeleccionado
        ? { ...campo, x, y }
        : campo
    ));
  };

  const actualizarCampo = (id: number, propiedad: string, valor: any) => {
    setCampos(campos.map(campo =>
      campo.id === id
        ? { ...campo, [propiedad]: valor }
        : campo
    ));
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);
    setMensaje(null);

    try {
      const config = {
        empresaId,
        campos: campos.map(c => ({
          nombre_campo: c.nombre_campo,
          label: c.label,
          x: c.x,
          y: c.y,
          font_size: c.font_size,
          font_family: c.font_family,
          font_color: c.font_color,
          requerido: c.requerido
        })),
        qr: qrConfig,
        codigo: codigoConfig
      };

      const response = await fetch('/api/plantillas/configurar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: '✅ Configuración guardada correctamente' });
        if (onGuardado) onGuardado();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar la configuración' });
    } finally {
      setGuardando(false);
    }
  };

  const campoActual = campos.find(c => c.id === campoSeleccionado);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎨 Diseñador de Certificados
        </h2>
        <p className="text-gray-600">
          Haz clic en un campo de la izquierda, luego haz clic en la plantilla para posicionarlo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Panel de Canvas */}
        <div className="lg:col-span-2">
          <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50">
            <div
              ref={canvasRef}
              className="relative cursor-crosshair bg-white rounded-lg shadow-inner overflow-hidden"
              onClick={handleCanvasClick}
              style={{ maxWidth: '100%', aspectRatio: `${dimensiones.ancho}/${dimensiones.alto}` }}
            >
              <Image
                ref={imgRef as any}
                src={plantillaUrl}
                alt="Plantilla"
                width={dimensiones.ancho}
                height={dimensiones.alto}
                className="w-full h-auto"
                onLoad={handleImageLoad}
                priority
              />

              {/* Renderizar campos */}
              {campos.map(campo => {
                const rect = canvasRef.current?.getBoundingClientRect();
                const scale = rect ? rect.width / dimensiones.ancho : 1;

                return (
                  <div
                    key={campo.id}
                    className={`absolute pointer-events-none ${
                      campoSeleccionado === campo.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: `${(campo.x / dimensiones.ancho) * 100}%`,
                      top: `${(campo.y / dimensiones.alto) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${campo.font_size * scale}px`,
                      fontFamily: campo.font_family,
                      color: campo.font_color,
                      fontWeight: 'bold',
                      textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {campo.label}
                  </div>
                );
              })}

              {/* QR Code placeholder */}
              <div
                className="absolute border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 flex items-center justify-center text-xs text-blue-600 font-bold"
                style={{
                  left: `${(qrConfig.x / dimensiones.ancho) * 100}%`,
                  top: `${(qrConfig.y / dimensiones.alto) * 100}%`,
                  width: `${(qrConfig.size / dimensiones.ancho) * 100}%`,
                  height: `${(qrConfig.size / dimensiones.alto) * 100}%`
                }}
              >
                QR
              </div>

              {/* Código placeholder */}
              <div
                className="absolute text-xs"
                style={{
                  left: `${(codigoConfig.x / dimensiones.ancho) * 100}%`,
                  top: `${(codigoConfig.y / dimensiones.alto) * 100}%`,
                  fontSize: `${codigoConfig.size * (canvasRef.current?.getBoundingClientRect().width || 800) / dimensiones.ancho}px`,
                  color: codigoConfig.color
                }}
              >
                VAXA-1234-ABC
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>💡 <strong>Tip:</strong> Selecciona un campo y haz clic en la plantilla para moverlo</p>
              <p className="mt-1">📐 Dimensiones: {dimensiones.ancho}x{dimensiones.alto}px</p>
            </div>
          </div>
        </div>

        {/* Panel de Controles */}
        <div className="space-y-4">

          {/* Lista de Campos */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Campos de Texto
            </h3>

            <div className="space-y-2">
              {campos.map(campo => (
                <button
                  key={campo.id}
                  onClick={() => setCampoSeleccionado(campo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    campoSeleccionado === campo.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-white border border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-sm">{campo.label}</div>
                  <div className="text-xs text-gray-500">
                    {campo.font_size}px · {campo.font_family}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor del Campo Seleccionado */}
          {campoActual && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                Editando: {campoActual.label}
              </h3>

              <div className="space-y-3">
                {/* Tamaño de fuente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño: {campoActual.font_size}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={campoActual.font_size}
                    onChange={(e) => actualizarCampo(campoActual.id, 'font_size', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Fuente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuente
                  </label>
                  <select
                    value={campoActual.font_family}
                    onChange={(e) => actualizarCampo(campoActual.id, 'font_family', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {fuentes.map(fuente => (
                      <option key={fuente} value={fuente}>{fuente}</option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={campoActual.font_color}
                      onChange={(e) => actualizarCampo(campoActual.id, 'font_color', e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={campoActual.font_color}
                      onChange={(e) => actualizarCampo(campoActual.id, 'font_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Posición manual */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                    <input
                      type="number"
                      value={campoActual.x}
                      onChange={(e) => actualizarCampo(campoActual.id, 'x', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                    <input
                      type="number"
                      value={campoActual.y}
                      onChange={(e) => actualizarCampo(campoActual.id, 'y', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón Guardar */}
          <button
            onClick={guardarConfiguracion}
            disabled={guardando}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Configuración
              </>
            )}
          </button>

          {/* Mensaje */}
          {mensaje && (
            <div className={`p-3 rounded-lg ${
              mensaje.tipo === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {mensaje.texto}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
