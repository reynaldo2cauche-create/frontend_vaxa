'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, User, FileText, Calendar, Download, Eye, Loader2, ArrowLeft, Edit2, Save, X, RefreshCw } from 'lucide-react';

interface Certificado {
  id: number;
  codigo_unico: string;
  nombre_actual: string;
  tiene_override: boolean;
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
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  // Estados para edición
  const [editandoCertificado, setEditandoCertificado] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [regenerando, setRegenerando] = useState<number | null>(null);

  // Obtener empresaId del localStorage
  useEffect(() => {
    const empresaData = localStorage.getItem('empresa');
    if (empresaData) {
      try {
        const empresa = JSON.parse(empresaData);
        setEmpresaId(empresa.id);
        console.log('📌 Empresa ID cargado:', empresa.id);
      } catch (error) {
        console.error('Error parsing empresa data:', error);
      }
    }
  }, []);

  const buscarParticipante = async () => {
    if (!terminoBusqueda.trim()) {
      alert('Por favor ingresa un DNI o nombre para buscar');
      return;
    }

    if (!empresaId) {
      alert('Error: No se pudo obtener el ID de la empresa. Por favor recarga la página.');
      return;
    }

    setBuscando(true);
    setNoEncontrado(false);
    setParticipante(null);

    try {
      console.log(`🔍 Buscando: "${terminoBusqueda}" en empresa ${empresaId}`);
      const response = await fetch(`/api/participantes/buscar?termino=${encodeURIComponent(terminoBusqueda)}&empresaId=${empresaId}`, {
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error response:', errorData);

        if (response.status === 404) {
          setNoEncontrado(true);
        } else if (response.status === 401) {
          alert('No estás autenticado. Por favor inicia sesión nuevamente.');
          router.push(`/${slug}/login`);
        } else {
          alert(`Error: ${errorData.error || 'Error al buscar participante'}`);
        }
        return;
      }

      const data = await response.json();
      console.log('✅ Data recibida:', data);

      if (data.success && data.data) {
        setParticipante(data.data);
        console.log('👤 Participante:', data.data);
        console.log('📋 Certificados:', data.data.certificados?.length || 0);
      } else {
        alert('No se encontraron datos del participante');
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert(`Error al buscar participante: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setBuscando(false);
    }
  };

  const iniciarEdicion = (certificado: Certificado) => {
    setEditandoCertificado(certificado.id);
    setNombreEditado(certificado.nombre_actual);
  };

  const cancelarEdicion = () => {
    setEditandoCertificado(null);
    setNombreEditado('');
  };

  const guardarYRegenerar = async (certificadoId: number) => {
    if (!nombreEditado.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setRegenerando(certificadoId);

    try {
      console.log(`🔄 Regenerando certificado ${certificadoId} con nombre: "${nombreEditado}"`);

      const response = await fetch(`/api/certificados/${certificadoId}/regenerar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nombrePersonalizado: nombreEditado
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al regenerar certificado');
      }

      const result = await response.json();
      console.log('✅ Certificado regenerado:', result);

      // Actualizar el certificado en el estado local
      if (participante) {
        const certificadosActualizados = participante.certificados.map(cert =>
          cert.id === certificadoId
            ? { ...cert, nombre_actual: nombreEditado, tiene_override: true }
            : cert
        );
        setParticipante({
          ...participante,
          certificados: certificadosActualizados
        });
      }

      setEditandoCertificado(null);
      setNombreEditado('');
      alert('Certificado regenerado exitosamente');
    } catch (error) {
      console.error('Error al regenerar:', error);
      alert(error instanceof Error ? error.message : 'Error al regenerar el certificado');
    } finally {
      setRegenerando(null);
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
              No se encontro ningun participante con el DNI o nombre: <strong>"{terminoBusqueda}"</strong>
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
                <h2 className="text-2xl font-bold text-gray-800">Informacion del Participante</h2>
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
                    <p className="text-sm text-gray-600 mb-1">Telefono</p>
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
                    Este participante aun no tiene certificados generados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {participante.certificados.map((cert) => (
                    <div
                      key={cert.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      {/* Información del certificado */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start mb-4">
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-1">Codigo Unico</p>
                          <p className="text-lg font-bold text-blue-600">{cert.codigo_unico}</p>
                          {cert.tiene_override && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              Nombre personalizado
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tipo</p>
                          <p className="text-sm font-semibold text-gray-900">{cert.tipo_documento || 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Curso</p>
                          <p className="text-sm font-semibold text-gray-900">{cert.curso || 'N/A'}</p>
                        </div>

                        <div className="md:col-span-2 flex gap-2">
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

                      {/* Edición de nombre */}
                      <div className="pt-4 border-t border-gray-200">
                        {editandoCertificado === cert.id ? (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Editar nombre en el certificado:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={nombreEditado}
                                onChange={(e) => setNombreEditado(e.target.value)}
                                className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
                                placeholder="Nombre completo..."
                                disabled={regenerando === cert.id}
                              />
                              <button
                                onClick={() => guardarYRegenerar(cert.id)}
                                disabled={regenerando === cert.id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {regenerando === cert.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Regenerando...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4" />
                                    Guardar y Regenerar PDF
                                  </>
                                )}
                              </button>
                              <button
                                onClick={cancelarEdicion}
                                disabled={regenerando === cert.id}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                              >
                                <X className="w-4 h-4" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Nombre en el certificado:</p>
                              <p className="text-base font-semibold text-gray-900">{cert.nombre_actual}</p>
                            </div>
                            <button
                              onClick={() => iniciarEdicion(cert)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                              <Edit2 className="w-4 h-4" />
                              Editar Nombre
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Generado el: {new Date(cert.fecha_emision).toLocaleDateString('es-ES')}</span>
                          <span className="mx-2">|</span>
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
