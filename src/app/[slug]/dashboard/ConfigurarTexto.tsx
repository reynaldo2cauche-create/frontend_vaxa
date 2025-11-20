'use client';

import { useState } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

interface Props {
  onTextoGuardado: (texto: string) => void;
  textoInicial?: string;
}

export default function ConfigurarTexto({ onTextoGuardado, textoInicial = '' }: Props) {
  const MAX_CARACTERES = 300;
  const [texto, setTexto] = useState(textoInicial);
  const [mejorando, setMejorando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  const mejorarTextoConIA = async () => {
    if (!texto.trim()) {
      mostrarMensaje('error', 'Escribe un texto primero');
      return;
    }

    try {
      setMejorando(true);

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
      mostrarMensaje('success', 'Texto mejorado con IA');

    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al mejorar texto');
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
    mostrarMensaje('success', 'Texto guardado correctamente');
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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto del Certificado
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Este texto aparecerá en todos los certificados del lote
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`${mensaje.tipo === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg p-3 text-sm flex items-center gap-2`}>
          {mensaje.tipo === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {mensaje.texto}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={texto}
          onChange={handleTextoChange}
          placeholder="Escribe el texto que aparecerá en el certificado. Ejemplo: Por su destacada participación en el curso..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:border-gray-400"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {caracteresRestantes} caracteres restantes
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={mejorarTextoConIA}
          disabled={mejorando || !texto.trim()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mejorando ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Mejorando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Mejorar con IA
            </>
          )}
        </button>

        <button
          onClick={guardarTexto}
          disabled={!texto.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          Guardar Texto
        </button>
      </div>

      {/* Ejemplo */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700 mb-1">Ejemplo:</p>
        <p className="text-xs text-gray-600 italic">
          "Por su destacada participación y excelente desempeño en el curso de Marketing Digital,
          habiendo cumplido satisfactoriamente con las actividades programadas..."
        </p>
      </div>
    </div>
  );
}
