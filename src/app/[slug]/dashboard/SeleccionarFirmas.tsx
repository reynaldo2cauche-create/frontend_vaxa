import { useState, useEffect } from 'react';
import { CheckCircle, Circle, FileSignature, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  firma_url: string;
}

interface Props {
  empresaId: number;
  onFirmasSeleccionadas: (firmas: Firma[]) => void;
  firmasPreSeleccionadas?: Firma[];
}

export default function SeleccionarFirmas({ empresaId, onFirmasSeleccionadas, firmasPreSeleccionadas = [] }: Props) {
  const [firmasDisponibles, setFirmasDisponibles] = useState<Firma[]>([]);
  const [firmasSeleccionadas, setFirmasSeleccionadas] = useState<Firma[]>(firmasPreSeleccionadas);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarFirmas();
  }, [empresaId]);

  const cargarFirmas = async () => {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch(`/api/firmas?empresaId=${empresaId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setFirmasDisponibles(data.data);
      } else {
        setError(data.error || 'Error al cargar firmas');
      }
    } catch (err) {
      setError('Error de conexión al cargar firmas');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const toggleFirma = (firma: Firma) => {
    const yaSeleccionada = firmasSeleccionadas.find(f => f.id === firma.id);

    let nuevasSeleccionadas: Firma[];

    if (yaSeleccionada) {
      // Deseleccionar
      nuevasSeleccionadas = firmasSeleccionadas.filter(f => f.id !== firma.id);
    } else {
      // Validar límite de 3 firmas
      if (firmasSeleccionadas.length >= 3) {
        alert('Solo puedes seleccionar hasta 3 firmas por certificado');
        return;
      }
      // Seleccionar
      nuevasSeleccionadas = [...firmasSeleccionadas, firma];
    }

    setFirmasSeleccionadas(nuevasSeleccionadas);
    onFirmasSeleccionadas(nuevasSeleccionadas);
  };

  const estaSeleccionada = (firmaId: number) => {
    return firmasSeleccionadas.some(f => f.id === firmaId);
  };

  const obtenerOrden = (firmaId: number) => {
    const index = firmasSeleccionadas.findIndex(f => f.id === firmaId);
    return index >= 0 ? index + 1 : null;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando firmas digitales...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-red-800 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={cargarFirmas}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (firmasDisponibles.length === 0) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
        <FileSignature className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
        <h4 className="font-bold text-yellow-900 mb-2">No hay firmas digitales disponibles</h4>
        <p className="text-sm text-yellow-700">
          Contacta al administrador de Vaxa para agregar firmas digitales a tu empresa.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Seleccionar Firmas Digitales</h3>
        <p className="text-gray-600">
          Selecciona hasta 3 firmas que aparecerán en los certificados
          {firmasSeleccionadas.length > 0 && (
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {firmasSeleccionadas.length} / 3 seleccionadas
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {firmasDisponibles.map((firma) => {
          const seleccionada = estaSeleccionada(firma.id);
          const orden = obtenerOrden(firma.id);

          return (
            <div
              key={firma.id}
              onClick={() => toggleFirma(firma)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                seleccionada
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Indicador de selección */}
              <div className="absolute top-4 right-4">
                {seleccionada ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                      #{orden}
                    </span>
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex items-start gap-4 pr-16">
                {/* Imagen de la firma */}
                <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={firma.firma_url}
                    alt={`Firma de ${firma.nombre}`}
                    fill
                    className="object-contain p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="text-xs text-gray-500">Sin imagen</div>';
                      }
                    }}
                  />
                </div>

                {/* Información de la firma */}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">{firma.nombre}</h4>
                  <p className="text-sm text-gray-600">{firma.cargo}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advertencia si no hay firmas seleccionadas */}
      {firmasSeleccionadas.length === 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Las firmas son opcionales. Puedes continuar sin seleccionar ninguna o seleccionar hasta 3.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de firmas seleccionadas */}
      {firmasSeleccionadas.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="font-semibold text-green-900 mb-2">Firmas seleccionadas (en orden):</h5>
          <ol className="space-y-1">
            {firmasSeleccionadas.map((firma, index) => (
              <li key={firma.id} className="text-sm text-green-800">
                <span className="font-medium">{index + 1}.</span> {firma.nombre} - {firma.cargo}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
