'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, User, FileText, Calendar, Download, Eye, Loader2, ArrowLeft } from 'lucide-react';

interface Certificado {
  id: number;
  codigo_unico: string;
  fecha_emision: string;
  pdf_url: string;
  lote_id: number;
  tipo_documento: string;
  curso: string;
}

interface Participante {
  id: number;
  dni: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa_id: number;
  certificados: Certificado[];
}

export default function ParticipantesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [buscando, setBuscando] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);

  const buscarParticipante = async () => {
    if (!terminoBusqueda.trim()) {
      alert('Por favor ingresa un DNI o nombre para buscar');
      return;
    }

    setBuscando(true);
    setNoEncontrado(false);
    setParticipante(null);

    try {
      const response = await fetch(`/api/participantes/buscar?termino=${encodeURIComponent(terminoBusqueda)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setNoEncontrado(true);
        } else {
          throw new Error('Error al buscar participante');
        }
        return;
      }

      const data = await response.json();
      setParticipante(data.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al buscar participante');
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarParticipante();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${slug}/dashboard`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Buscar Participantes
            </h1>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* BUSCADOR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Buscar Participante</h2>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Buscar por DNI o nombre completo..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
              />
            </div>
            <button
              onClick={buscarParticipante}
              disabled={buscando}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {buscando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {/* NO ENCONTRADO */}
        {noEncontrado && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
            <User className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-yellow-800 mb-2">
              Participante no encontrado
            </h3>
            <p className="text-yellow-700">
              No se encontró ningún participante con el DNI o nombre: <strong>"{terminoBusqueda}"</strong>
            </p>
          </div>
        )}

        {/* RESULTADO */}
        {participante && (
          <div className="space-y-6">
            {/* INFO DEL PARTICIPANTE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Información del Participante</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nombre Completo</p>
                  <p className="text-lg font-semibold text-gray-900">{participante.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">DNI</p>
                  <p className="text-lg font-semibold text-gray-900">{participante.dni}</p>
                </div>
                {participante.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{participante.email}</p>
                  </div>
                )}
                {participante.telefono && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                    <p className="text-lg font-semibold text-gray-900">{participante.telefono}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CERTIFICADOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Certificados ({participante.certificados.length})
                  </h2>
                </div>
              </div>

              {participante.certificados.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Este participante aún no tiene certificados generados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {participante.certificados.map((cert) => (
                    <div
                      key={cert.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-1">Código Único</p>
                          <p className="text-lg font-bold text-blue-600">{cert.codigo_unico}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tipo</p>
                          <p className="text-sm font-semibold text-gray-900">{cert.tipo_documento || 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Curso</p>
                          <p className="text-sm font-semibold text-gray-900">{cert.curso || 'N/A'}</p>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={cert.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </a>
                          <a
                            href={cert.pdf_url}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </a>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Generado el: {new Date(cert.fecha_emision).toLocaleDateString('es-ES')}</span>
                          <span className="mx-2">"</span>
                          <span>Lote #{cert.lote_id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
