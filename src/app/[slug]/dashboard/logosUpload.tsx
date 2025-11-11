import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, ImageIcon, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { Logo } from '@/lib/entities/Logo';
import ModalEliminarLogo from '@/components/ModalEliminarLogo/route';

interface LogosUploadProps {
  empresaId: number;
  onLogosActualizados?: (logos: Logo[]) => void;
}

export default function LogosUpload({ empresaId, onLogosActualizados }: LogosUploadProps) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalEliminar, setModalEliminar] = useState<{ isOpen: boolean; logo: Logo | null }>({
    isOpen: false,
    logo: null
  });
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarLogos();
  }, [empresaId]);

  async function cargarLogos() {
    try {
      const res = await fetch(`/api/logos/${empresaId}`, { 
        credentials: 'include' 
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogos(data.logos || []);
        if (onLogosActualizados) {
          onLogosActualizados(data.logos || []);
        }
      }
    } catch (err) {
      console.error('Error al cargar logos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function subirLogo(file: File, posicion: number) {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('El logo no debe superar los 2MB');
      return;
    }

    setUploading(posicion);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('empresaId', empresaId.toString());
      formData.append('posicion', posicion.toString());
      formData.append('nombre', `Logo ${posicion}`);

      const res = await fetch('/api/logos/subir', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al subir logo');
      }

      setSuccess(`Logo ${posicion} subido correctamente`);
      await cargarLogos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir logo');
    } finally {
      setUploading(null);
    }
  }

  function abrirModalEliminar(logo: Logo) {
    setModalEliminar({ isOpen: true, logo });
  }

  function cerrarModalEliminar() {
    setModalEliminar({ isOpen: false, logo: null });
  }

  async function confirmarEliminar() {
    if (!modalEliminar.logo) return;

    setEliminando(true);
    setError(null);

    try {
      const res = await fetch('/api/logos/eliminar', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logoId: modalEliminar.logo.id })
      });

      if (!res.ok) {
        throw new Error('Error al eliminar');
      }

      setSuccess(`${modalEliminar.logo.nombre} eliminado correctamente`);
      await cargarLogos();
      setTimeout(() => setSuccess(null), 3000);
      cerrarModalEliminar();
    } catch (err) {
      setError('Error al eliminar logo');
    } finally {
      setEliminando(false);
    }
  }

  const posicionesDisponibles = [1, 2, 3];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">Cargando logos...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Logos del Certificado</h3>
            <p className="text-sm text-gray-600">
              Sube hasta 3 logos que aparecerán en tus certificados (opcional)
            </p>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">¡Éxito!</p>
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        )}

        {/* Grid de logos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {posicionesDisponibles.map(pos => {
            const logoEnPosicion = logos.find(l => l.posicion === pos);
            const isUploading = uploading === pos;

            return (
              <div 
                key={pos} 
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 transition-all hover:border-purple-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600">
                    Logo {pos}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    {pos === 1 ? 'Izquierda' : pos === 2 ? 'Derecha' : 'Centro'}
                  </span>
                </div>

                {logoEnPosicion ? (
                  <div className="relative group">
                    <div className="relative w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={logoEnPosicion.url}
                        alt={logoEnPosicion.nombre}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <button
                      onClick={() => abrirModalEliminar(logoEnPosicion)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                      title="Eliminar logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center truncate">
                      {logoEnPosicion.nombre}
                    </p>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subirLogo(file, pos);
                        e.target.value = '';
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className={`
                      h-32 flex flex-col items-center justify-center gap-2 rounded-lg
                      transition-all
                      ${isUploading
                        ? 'bg-gray-100 cursor-wait'
                        : 'bg-purple-50 hover:bg-purple-100 active:scale-95'
                      }
                    `}>
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs text-purple-700 font-medium">Subiendo...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-purple-600" />
                          <p className="text-xs text-purple-700 font-medium">
                            Subir logo
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, WebP
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Información y recomendaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-800 mb-2">💡 Recomendaciones:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• PNG con fondo transparente (preferible)</li>
              <li>• Tamaño máximo: 2MB por logo</li>
              <li>• Dimensiones sugeridas: 400x400px</li>
              <li>• Logos cuadrados se ven mejor</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-800 mb-2">📍 Posiciones:</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• <strong>Logo 1:</strong> Esquina superior izquierda</li>
              <li>• <strong>Logo 2:</strong> Esquina superior derecha</li>
              <li>• <strong>Logo 3:</strong> Centro superior</li>
            </ul>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            {logos.length === 0 ? (
              'No has subido ningún logo aún'
            ) : (
              <>
                Has subido <strong>{logos.length}</strong> de 3 logos disponibles
              </>
            )}
          </p>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ModalEliminarLogo
        isOpen={modalEliminar.isOpen}
        onClose={cerrarModalEliminar}
        onConfirm={confirmarEliminar}
        nombreLogo={modalEliminar.logo?.nombre || ''}
        loading={eliminando}
      />
    </>
  );
}