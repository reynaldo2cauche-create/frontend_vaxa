import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';

interface PlantillaUploadProps {
  empresaId: number;
  onPlantillaSubida?: (url: string) => void;
}

export default function PlantillaUpload({ empresaId, onPlantillaSubida }: PlantillaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [plantillaActual, setPlantillaActual] = useState<string | null>(null);

  // Cargar plantilla actual al montar
  useEffect(() => {
    cargarPlantillaActual();
  }, [empresaId]);

  async function cargarPlantillaActual() {
    try {
      const response = await fetch(`/api/plantillas/${empresaId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.plantilla) {
          setPlantillaActual(data.plantilla.url);
          // Si ya existe una plantilla, notificar al padre que está lista
          if (onPlantillaSubida) {
            onPlantillaSubida(data.plantilla.url);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar plantilla:', error);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (PNG, JPG, JPEG)');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    subirPlantilla(file);
  }

  async function subirPlantilla(file: File) {
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('plantilla', file);
      formData.append('empresaId', empresaId.toString());

      const response = await fetch('/api/plantillas/subir', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al subir la plantilla');
      }

      const data = await response.json();
      setSuccess(true);
      setPlantillaActual(data.url);

      // Notificar al componente padre
      if (onPlantillaSubida) {
        onPlantillaSubida(data.url);
      }

      // Limpiar preview después de 3 segundos
      setTimeout(() => {
        setPreviewUrl(null);
        setSuccess(false);
      }, 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir la plantilla');
    } finally {
      setUploading(false);
    }
  }

  function limpiarPreview() {
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Plantilla de Certificado</h3>
          <p className="text-sm text-gray-600">Sube la imagen base para generar certificados</p>
        </div>
      </div>

      {/* Plantilla actual */}
      {plantillaActual && !previewUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Plantilla actual:</p>
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
            <Image
              src={plantillaActual}
              alt="Plantilla actual"
              width={800}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Preview de nueva plantilla */}
      {previewUrl && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Nueva plantilla:</p>
            <button
              onClick={limpiarPreview}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden border-2 border-indigo-500">
            <Image
              src={previewUrl}
              alt="Preview"
              width={800}
              height={600}
              className="w-full h-auto"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-gray-700">Subiendo...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">¡Éxito!</p>
            <p className="text-sm text-green-600">Plantilla subida correctamente</p>
          </div>
        </div>
      )}

      {/* Botón de subida */}
      <label className="block">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <div className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${uploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400'
          }
        `}>
          <Upload className={`w-12 h-12 mx-auto mb-4 ${uploading ? 'text-gray-400' : 'text-indigo-600'}`} />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {uploading ? 'Subiendo plantilla...' : 'Haz clic para seleccionar una imagen'}
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG o JPEG (máx. 5MB)
          </p>
        </div>
      </label>

      {/* Instrucciones */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-800 mb-2">💡 Recomendaciones:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Usa una imagen de alta resolución (mínimo 1920x1080px)</li>
          <li>• Formato horizontal para mejor visualización</li>
          <li>• Deja espacio para el nombre del participante y datos del QR</li>
        </ul>
      </div>
    </div>
  );
}