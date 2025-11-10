'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  firmaUrl: string;
}

interface Props {
  empresaId: number;
  onFirmasSeleccionadas: (firmas: Firma[]) => void;
  firmasInicial?: Firma[];
}

export default function SelectorFirmas({ empresaId, onFirmasSeleccionadas, firmasInicial = [] }: Props) {
  const [firmasDisponibles, setFirmasDisponibles] = useState<Firma[]>([]);
  const [firmasSeleccionadas, setFirmasSeleccionadas] = useState<Firma[]>(firmasInicial);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar firmas desde el API
  useEffect(() => {
    const cargarFirmas = async () => {
      try {
        setCargando(true);
        const response = await fetch(`/api/firmas?empresaId=${empresaId}`);

        if (!response.ok) {
          throw new Error('Error al cargar firmas');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setFirmasDisponibles(data.data);
        } else {
          mostrarMensaje('error', 'No se encontraron firmas disponibles');
        }
      } catch (error) {
        console.error('Error al cargar firmas:', error);
        mostrarMensaje('error', 'Error al cargar las firmas desde la base de datos');
      } finally {
        setCargando(false);
      }
    };

    cargarFirmas();
  }, [empresaId]);

  const toggleFirma = (firma: Firma) => {
    const yaSeleccionada = firmasSeleccionadas.find(f => f.id === firma.id);

    if (yaSeleccionada) {
      // Deseleccionar
      const nuevasFirmas = firmasSeleccionadas.filter(f => f.id !== firma.id);
      setFirmasSeleccionadas(nuevasFirmas);
    } else {
      // Seleccionar (máximo 3)
      if (firmasSeleccionadas.length >= 3) {
        mostrarMensaje('error', 'Solo puedes seleccionar máximo 3 firmas');
        return;
      }
      const nuevasFirmas = [...firmasSeleccionadas, firma];
      setFirmasSeleccionadas(nuevasFirmas);
    }
  };

  const confirmarSeleccion = () => {
    if (firmasSeleccionadas.length === 0) {
      mostrarMensaje('error', 'Selecciona al menos una firma');
      return;
    }

    onFirmasSeleccionadas(firmasSeleccionadas);
    mostrarMensaje('success', '✅ Firmas seleccionadas correctamente');
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  const estaSeleccionada = (firmaId: number) => {
    return firmasSeleccionadas.some(f => f.id === firmaId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Selecciona las Firmas
        </h3>
        <p className="text-gray-600">
          Puedes seleccionar hasta 3 firmas que aparecerán en los certificados
        </p>
      </div>

      {/* Loading state */}
      {cargando && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Cargando firmas...</span>
        </div>
      )}

      {/* Mensaje */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mensaje.tipo === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {mensaje.texto}
        </div>
      )}

      {/* Info */}
      {!cargando && firmasDisponibles.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>✓</strong> Firmas cargadas desde la base de datos.
            Selecciona hasta 3 firmas para tus certificados.
          </p>
        </div>
      )}

      {/* Sin firmas */}
      {!cargando && firmasDisponibles.length === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ No hay firmas disponibles.</strong> Contacta al administrador para que agregue firmas a la base de datos.
          </p>
        </div>
      )}

      {/* Contador */}
      {!cargando && firmasDisponibles.length > 0 && (
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            Firmas seleccionadas: <span className={`text-lg ${firmasSeleccionadas.length > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
              {firmasSeleccionadas.length}
            </span> / 3
          </p>
        </div>
      )}

      {/* Grid de firmas */}
      {!cargando && firmasDisponibles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {firmasDisponibles.map((firma) => {
          const seleccionada = estaSeleccionada(firma.id);

          return (
            <button
              key={firma.id}
              onClick={() => toggleFirma(firma)}
              className={`relative border-2 rounded-xl p-4 transition-all ${
                seleccionada
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {/* Check mark */}
              {seleccionada && (
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Imagen de la firma */}
              <div className="h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <Image
                  src={firma.firmaUrl}
                  alt={firma.nombre}
                  width={200}
                  height={80}
                  className="object-contain"
                  onError={(e) => {
                    // Si falla la carga, mostrar placeholder
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    `;
                  }}
                />
              </div>

              {/* Info */}
              <div className="text-left">
                <p className="font-bold text-gray-800 text-sm">{firma.nombre}</p>
                <p className="text-xs text-gray-600">{firma.cargo}</p>
              </div>
            </button>
          );
        })}
      </div>
      )}

      {/* Preview de firmas seleccionadas */}
      {!cargando && firmasSeleccionadas.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <h4 className="font-bold text-indigo-900 mb-4">
            📋 Firmas que aparecerán en el certificado:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {firmasSeleccionadas.map((firma, index) => (
              <div key={firma.id} className="bg-white rounded-lg p-4 border border-indigo-200">
                <div className="text-xs text-indigo-600 font-semibold mb-2">
                  Firma {index + 1}
                </div>
                <p className="text-sm font-bold text-gray-800">{firma.nombre}</p>
                <p className="text-xs text-gray-600">{firma.cargo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón confirmar */}
      {!cargando && firmasDisponibles.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={confirmarSeleccion}
            disabled={firmasSeleccionadas.length === 0}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            <Check className="w-5 h-5" />
            Confirmar Selección
          </button>
        </div>
      )}
    </div>
  );
}
