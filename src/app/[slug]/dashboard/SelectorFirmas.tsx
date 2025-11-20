'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, AlertCircle } from 'lucide-react';

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
        console.error('Error:', error);
        mostrarMensaje('error', 'Error al cargar las firmas');
      } finally {
        setCargando(false);
      }
    };

    cargarFirmas();
  }, [empresaId]);

  const toggleFirma = (firma: Firma) => {
    const yaSeleccionada = firmasSeleccionadas.find(f => f.id === firma.id);

    if (yaSeleccionada) {
      const nuevasFirmas = firmasSeleccionadas.filter(f => f.id !== firma.id);
      setFirmasSeleccionadas(nuevasFirmas);
    } else {
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
    mostrarMensaje('success', 'Firmas seleccionadas correctamente');
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Cargando firmas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Firmas Digitales
        </label>
        <p className="text-xs text-gray-500">
          Selecciona hasta 3 firmas para los certificados
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`${mensaje.tipo === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg p-3 text-sm flex items-center gap-2`}>
          {mensaje.tipo === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {mensaje.texto}
        </div>
      )}

      {/* Sin firmas */}
      {firmasDisponibles.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600">
            No hay firmas disponibles. Contacta al administrador.
          </p>
        </div>
      ) : (
        <>
          {/* Grid de firmas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {firmasDisponibles.map((firma) => {
              const seleccionada = firmasSeleccionadas.some(f => f.id === firma.id);

              return (
                <div
                  key={firma.id}
                  onClick={() => toggleFirma(firma)}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    seleccionada
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {seleccionada && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="relative w-full h-24 bg-gray-50 rounded border border-gray-200 mb-3">
                    <Image
                      src={firma.firmaUrl}
                      alt={firma.nombre}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <p className="font-medium text-sm text-gray-900 truncate">{firma.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{firma.cargo}</p>
                </div>
              );
            })}
          </div>

          {/* Contador */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              {firmasSeleccionadas.length} de 3 firmas seleccionadas
            </p>
          </div>

          {/* Botón confirmar */}
          <button
            onClick={confirmarSeleccion}
            disabled={firmasSeleccionadas.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Confirmar Selección ({firmasSeleccionadas.length})
          </button>
        </>
      )}
    </div>
  );
}
