import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
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
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar logo');
      }

      setSuccess('Logo eliminado correctamente');
      await cargarLogos();
      setTimeout(() => setSuccess(null), 3000);
      cerrarModalEliminar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar logo');
    } finally {
      setEliminando(false);
    }
  }

  const posicionesDisponibles = [1, 2, 3];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Cargando logos...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Grid de logos - minimalista */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posicionesDisponibles.map(pos => {
            const logoEnPosicion = logos.find(l => l.posicion === pos);
            const isUploading = uploading === pos;

            return (
              <div key={pos} className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  Logo {pos} • {pos === 1 ? 'Izq' : pos === 2 ? 'Der' : 'Centro'}
                </p>

                {logoEnPosicion ? (
                  <div className="relative group">
                    <div className="relative w-full h-24 bg-gray-50 rounded border border-gray-200 overflow-hidden">
                      <Image
                        src={logoEnPosicion.url}
                        alt={logoEnPosicion.nombre}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <button
                      onClick={() => abrirModalEliminar(logoEnPosicion)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subirLogo(file, pos);
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded h-24 flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Subir</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-medium mb-1">
            📐 <strong>Medidas recomendadas:</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-0.5">
            <li>• <strong>Cuadrado:</strong> 300 x 300 píxeles</li>
            <li>• <strong>Rectangular:</strong> 400 x 200 píxeles</li>
            <li>• <strong>Formato:</strong> PNG con fondo transparente</li>
            <li>• <strong>Peso:</strong> Máximo 2MB por logo</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <ModalEliminarLogo
        isOpen={modalEliminar.isOpen}
        onClose={cerrarModalEliminar}
        onConfirm={confirmarEliminar}
        logoNombre={modalEliminar.logo?.nombre || ''}
        eliminando={eliminando}
      />
    </>
  );
}