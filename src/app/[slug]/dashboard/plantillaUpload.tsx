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
    <div className="space-y-4">
      {/* Plantilla actual - compacto */}
      {plantillaActual && !previewUrl && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Image
            src={plantillaActual}
            alt="Plantilla actual"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Preview nueva */}
      {previewUrl && (
        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
          <Image src={previewUrl} alt="Preview" width={800} height={600} className="w-full h-auto" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                <span className="text-sm text-gray-700">Subiendo...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Plantilla subida correctamente
        </div>
      )}

      {/* Botón subida */}
      <label className="block">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Haz clic para subir imagen</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG (máx. 5MB)</p>
        </div>
      </label>
    </div>
  );
}