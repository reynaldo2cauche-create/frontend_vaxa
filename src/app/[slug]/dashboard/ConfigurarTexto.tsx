'use client';

import { useState } from 'react';
import { FileText, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';

interface Props {
  onTextoGuardado: (texto: string) => void;
  textoInicial?: string;
}

export default function ConfigurarTexto({ onTextoGuardado, textoInicial = '' }: Props) {
  const MAX_CARACTERES = 300;
  const [texto, setTexto] = useState(textoInicial);
  const [mejorando, setMejorando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [textoOriginal, setTextoOriginal] = useState('');
  const [mostrarComparacion, setMostrarComparacion] = useState(false);

  const mejorarTextoConIA = async () => {
    if (!texto.trim()) {
      mostrarMensaje('error', 'Escribe un texto primero');
      return;
    }

    try {
      setMejorando(true);
      setTextoOriginal(texto);

      const response = await fetch('/api/mejorar-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      });

      if (!response.ok) {
        throw new Error('Error al mejorar texto');
      }

      const data = await response.json();
      setTexto(data.textoMejorado);
      setMostrarComparacion(true);
      mostrarMensaje('success', '✨ Texto mejorado con IA');

      setTimeout(() => setMostrarComparacion(false), 8000);

    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al mejorar texto. Intenta nuevamente.');
    } finally {
      setMejorando(false);
    }
  };

  const guardarTexto = () => {
    if (!texto.trim()) {
      mostrarMensaje('error', 'Escribe un texto antes de guardar');
      return;
    }

    onTextoGuardado(texto);
    mostrarMensaje('success', '✅ Texto guardado correctamente');
  };

  const mostrarMensaje = (tipo: 'success' | 'error', textoMsg: string) => {
    setMensaje({ tipo, texto: textoMsg });
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleTextoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nuevoTexto = e.target.value;
    if (nuevoTexto.length <= MAX_CARACTERES) {
      setTexto(nuevoTexto);
    }
  };

  const caracteresRestantes = MAX_CARACTERES - texto.length;
  const porcentajeUsado = (texto.length / MAX_CARACTERES) * 100;

  const getColorContador = () => {
    if (porcentajeUsado >= 90) return 'text-red-600';
    if (porcentajeUsado >= 75) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Configura el Texto Estático
        </h3>
        <p className="text-gray-600">
          Este texto será el MISMO para todos los certificados del lote
        </p>
      </div>

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
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 mb-3">
          ℹ️ Sobre el texto estático
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Escribe el texto que aparecerá en TODOS los certificados</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Los datos personales (nombres, DNI, etc.) se agregarán automáticamente del Excel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>No uses variables ni placeholders, solo escribe el texto normal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Usa el botón &quot;Mejorar con IA&quot; para corregir ortografía y formalizar el lenguaje</span>
          </li>
        </ul>
      </div>

    {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto del certificado
        </label>
        <textarea
          value={texto}
          onChange={handleTextoChange}
          maxLength={MAX_CARACTERES}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          rows={10}
          placeholder="Ejemplo: Por la presente se certifica que ha participado exitosamente en el programa de capacitación, cumpliendo satisfactoriamente con las actividades y evaluaciones establecidas. Su dedicación y compromiso durante el desarrollo del curso han sido ejemplares..."
          spellCheck="true"
          lang="es"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            💡 El corrector ortográfico está activado
          </p>
          <p className={`text-xs font-semibold ${getColorContador()}`}>
            {caracteresRestantes} caracteres restantes
          </p>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              porcentajeUsado >= 90 ? 'bg-red-500' : 
              porcentajeUsado >= 75 ? 'bg-orange-500' : 
              'bg-purple-500'
            }`}
            style={{ width: `${porcentajeUsado}%` }}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={mejorarTextoConIA}
          disabled={mejorando || !texto.trim()}
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
          onClick={guardarTexto}
          disabled={!texto.trim()}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Guardar Texto
        </button>
      </div>

      {/* Comparación antes/después */}
      {mostrarComparacion && textoOriginal && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-purple-900">Mejoras realizadas por IA</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs font-bold text-red-900 uppercase mb-2">Texto Original</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-through opacity-70">
                {textoOriginal}
              </p>
            </div>

            {/* Mejorado */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-bold text-green-900 uppercase mb-2">Texto Mejorado</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
                {texto}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMostrarComparacion(false)}
            className="text-xs text-purple-600 hover:text-purple-800 underline mt-3"
          >
            Cerrar comparación
          </button>
        </div>
      )}

      {/* Vista previa */}
      {texto && !mostrarComparacion && (
        <div className="bg-gray-50 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">📄 Vista previa:</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {texto}
          </p>
        </div>
      )}
    </div>
  );
}
