'use client';

import { useState } from 'react';
import {
  FileText,
  Check,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Props {
  empresaId: number;
  onTextoConfigurado?: () => void;
}

export default function GestorTextos({ empresaId, onTextoConfigurado }: Props) {
  const [textoPersonalizado, setTextoPersonalizado] = useState('');
  const [mejorando, setMejorando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [textoOriginal, setTextoOriginal] = useState('');
  const [mostrarComparacion, setMostrarComparacion] = useState(false);
  const [cambiosRealizados, setCambiosRealizados] = useState<string[]>([]);

  const mejorarTextoConIA = async () => {
    if (!textoPersonalizado.trim()) {
      mostrarMensaje('error', 'Escribe un texto primero');
      return;
    }

    try {
      setMejorando(true);
      setTextoOriginal(textoPersonalizado);

      const response = await fetch('/api/mejorar-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: textoPersonalizado })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      setTextoPersonalizado(data.textoMejorado);
      setCambiosRealizados(data.cambios || []);
      setMostrarComparacion(true);
      mostrarMensaje('success', '✨ Texto mejorado profesionalmente');

      setTimeout(() => {
        setMostrarComparacion(false);
      }, 10000);

    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al mejorar texto');
    } finally {
      setMejorando(false);
    }
  };

  const guardarTextoPersonalizado = async () => {
    if (!textoPersonalizado.trim()) {
      mostrarMensaje('error', 'Escribe un texto personalizado');
      return;
    }

    try {
      setGuardando(true);

      // Guardar el texto personalizado
      const response = await fetch('/api/plantillas/asignar-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          plantillaTextoId: null,
          textoPersonalizado: textoPersonalizado
        })
      });

      if (response.ok) {
        mostrarMensaje('success', '✅ Texto guardado correctamente');

        // Notificar que el texto está configurado
        setTimeout(() => {
          if (onTextoConfigurado) {
            onTextoConfigurado();
          }
        }, 1500);
      } else {
        const data = await response.json();
        mostrarMensaje('error', `❌ ${data.error || 'Error al guardar'}`);
      }

    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', '❌ Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Texto del Certificado
        </h3>
        <p className="text-gray-600 text-sm">
          Escribe el texto que aparecerá en tus certificados
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-2 animate-fade-in ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mensaje.tipo === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {mensaje.texto}
        </div>
      )}

      {/* Info sobre variables */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium mb-2">
          💡 Variables disponibles para usar en el texto:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
          <code className="bg-white px-2 py-1 rounded">{'{nombre}'}</code>
          <code className="bg-white px-2 py-1 rounded">{'{documento}'}</code>
          <code className="bg-white px-2 py-1 rounded">{'{tipo_documento}'}</code>
          <code className="bg-white px-2 py-1 rounded">{'{curso}'}</code>
          <code className="bg-white px-2 py-1 rounded">{'{fecha}'}</code>
          <code className="bg-white px-2 py-1 rounded">{'{horas}'}</code>
          <code className="bg-white px-2 py-1 rounded">{'{ciudad}'}</code>
        </div>
      </div>

      <div className="space-y-4">
        {/* Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto del certificado
          </label>
          <textarea
            value={textoPersonalizado}
            onChange={(e) => setTextoPersonalizado(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={8}
            placeholder="Ejemplo: Se otorga el presente certificado a {nombre}, identificado(a) con {tipo_documento} N° {documento}, por haber completado satisfactoriamente el curso de {curso} realizado el {fecha}..."
            spellCheck="true"
            lang="es"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 El corrector ortográfico está activado. Las palabras con error se subrayan.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={mejorarTextoConIA}
            disabled={mejorando || !textoPersonalizado.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {mejorando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mejorando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Mejorar con IA
              </>
            )}
          </button>

          <button
            onClick={guardarTextoPersonalizado}
            disabled={guardando || !textoPersonalizado.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Guardar texto
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparación antes/después */}
      {mostrarComparacion && textoOriginal && (
        <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-purple-900">Mejoras realizadas por IA</h4>
          </div>

          {/* Lista de cambios */}
          {cambiosRealizados.length > 0 && (
            <div className="mb-4 bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">✨ Cambios aplicados:</p>
              <ul className="space-y-1">
                {cambiosRealizados.map((cambio, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{cambio}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparación lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Texto original */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <p className="text-xs font-bold text-red-900 uppercase">Texto Original</p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-through opacity-70">
                {textoOriginal}
              </p>
            </div>

            {/* Texto mejorado */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <p className="text-xs font-bold text-green-900 uppercase">Texto Mejorado</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
                {textoPersonalizado}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-purple-700">
              💡 Se corrigieron errores y se transformó a lenguaje profesional
            </p>
            <button
              onClick={() => setMostrarComparacion(false)}
              className="text-xs text-purple-600 hover:text-purple-800 underline"
            >
              Cerrar comparación
            </button>
          </div>
        </div>
      )}

      {/* Vista previa */}
      {textoPersonalizado && !mostrarComparacion && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-semibold text-gray-700 mb-2">Vista previa:</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {textoPersonalizado}
          </p>
        </div>
      )}
    </div>
  );
}
