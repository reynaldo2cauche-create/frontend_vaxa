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
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para edición de certificados
  const [editandoCertificado, setEditandoCertificado] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [regenerando, setRegenerando] = useState<number | null>(null);

  // 🆕 Estados para edición de participante
  const [editandoParticipante, setEditandoParticipante] = useState<number | null>(null);
  const [participanteEditado, setParticipanteEditado] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: ''
  });
  const [guardandoParticipante, setGuardandoParticipante] = useState(false);

  // Obtener empresaId desde el API (igual que el dashboard)
  useEffect(() => {
    const loadEmpresa = async () => {
      try {
        const response = await fetch(`/api/dashboard/${slug}`, {
          credentials: 'include'
        });

        if (response.status === 401) {
          router.push(`/login/${slug}`);
          return;
        }

        if (!response.ok) {
          throw new Error('Error al cargar empresa');
        }

        const data = await response.json();
        setEmpresaId(data.empresa.id);
        console.log('📌 Empresa ID cargado:', data.empresa.id);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        router.push(`/login/${slug}`);
      }
    };

    loadEmpresa();
  }, [slug, router]);

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
    setParticipantes([]);

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

      if (data.success && data.data && Array.isArray(data.data)) {
        setParticipantes(data.data);
        console.log(`👥 Participantes encontrados: ${data.data.length}`);
      } else {
        alert('No se encontraron datos de participantes');
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

  // 🆕 Iniciar edición de participante
  const iniciarEdicionParticipante = (participante: Participante) => {
    setEditandoParticipante(participante.id);
    // Separar nombre completo en nombres y apellidos
    const nombreCompleto = participante.nombre.split(' ');
    const apellidos = nombreCompleto.slice(-2).join(' '); // Últimas 2 palabras como apellidos
    const nombres = nombreCompleto.slice(0, -2).join(' ') || nombreCompleto[0]; // El resto como nombres

    setParticipanteEditado({
      nombres: nombres,
      apellidos: apellidos,
      email: participante.email || '',
      telefono: participante.telefono || '',
      dni: participante.dni
    });
  };

  // 🆕 Cancelar edición de participante
  const cancelarEdicionParticipante = () => {
    setEditandoParticipante(null);
    setParticipanteEditado({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      dni: ''
    });
  };

  // 🆕 Guardar cambios del participante (SIN regenerar certificados)
  const guardarParticipante = async (participanteId: number) => {
    if (!participanteEditado.nombres.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setGuardandoParticipante(true);

    try {
      console.log(`💾 Guardando datos del participante ${participanteId}...`);

      const response = await fetch(`/api/participantes/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          participante_id: participanteId,
          nombres: participanteEditado.nombres,
          apellidos: participanteEditado.apellidos,
          correo_electronico: participanteEditado.email || null,
          telefono: participanteEditado.telefono || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar los datos');
      }

      console.log('✅ Datos del participante guardados exitosamente');

      // Actualizar la vista local
      setParticipantes(prevParticipantes =>
        prevParticipantes.map(p =>
          p.id === participanteId
            ? {
                ...p,
                nombre: `${participanteEditado.nombres}`.trim(),
                email: participanteEditado.email,
                telefono: participanteEditado.telefono
              }
            : p
        )
      );

      setEditandoParticipante(null);
      alert('✅ Datos del participante actualizados correctamente.\n\nNOTA: Los certificados ya emitidos mantendrán el nombre original. Para cambiar el nombre en un certificado específico, edítalo individualmente.');

    } catch (error) {
      console.error('❌ Error:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar los datos');
    } finally {
      setGuardandoParticipante(false);
    }
  };

const guardarYRegenerar = async (certificadoId: number) => {
  if (!nombreEditado.trim()) {
    alert('El nombre no puede estar vacío');
    return;
  }

  setRegenerando(certificadoId);

  try {
    console.log(`✏️ Guardando nombre para certificado ${certificadoId}: "${nombreEditado}"`);

    // PASO 1: Guardar el nombre editado
    const editResponse = await fetch(`/api/certificados/${certificadoId}/editar-nombre`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        nuevoNombre: nombreEditado
      })
    });

    if (!editResponse.ok) {
      const error = await editResponse.json();
      throw new Error(error.error || 'Error al guardar el nombre');
    }

    const editResult = await editResponse.json();
    console.log('✅ Nombre guardado:', editResult);

    // PASO 2: Regenerar el certificado con el nuevo nombre
    console.log(`🔄 Regenerando certificado ${certificadoId}...`);
    
    const regenResponse = await fetch(`/api/certificados/${certificadoId}/regenerar`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!regenResponse.ok) {
      const error = await regenResponse.json();
      throw new Error(error.error || 'Error al regenerar certificado');
    }

    const regenResult = await regenResponse.json();
    console.log('✅ Certificado regenerado:', regenResult);

    // PASO 3: Actualizar el estado local
    setParticipantes(prevParticipantes =>
      prevParticipantes.map(p => ({
        ...p,
        certificados: p.certificados.map(cert =>
          cert.id === certificadoId
            ? { 
                ...cert, 
                nombre_actual: nombreEditado, 
                tiene_override: true,
                pdf_url: regenResult.data.rutaArchivo || cert.pdf_url // Actualizar URL del PDF
              }
            : cert
        )
      }))
    );

    setEditandoCertificado(null);
    setNombreEditado('');
    alert('✅ Certificado actualizado y regenerado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
    alert(error instanceof Error ? error.message : 'Error al procesar el certificado');
  } finally {
    setRegenerando(null);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarParticipante();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

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
              No se encontro ningun participante con el DNI o nombre: <strong>&quot;{terminoBusqueda}&quot;</strong>
            </p>
          </div>
        )}

        {/* RESULTADOS */}
        {participantes.length > 0 && (
          <div className="space-y-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 font-semibold">
                Se encontraron {participantes.length} participante{participantes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {participantes.map((participante) => (
              <div key={participante.id} className="space-y-6 pb-8 border-b-4 border-gray-200 last:border-b-0">
                {/* INFO DEL PARTICIPANTE */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-green-600" />
                      <h2 className="text-2xl font-bold text-gray-800">Informacion del Participante</h2>
                    </div>
                    {editandoParticipante === participante.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarParticipante(participante.id)}
                          disabled={guardandoParticipante}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {guardandoParticipante ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Guardar
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelarEdicionParticipante}
                          disabled={guardandoParticipante}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEdicionParticipante(participante)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar Datos
                      </button>
                    )}
                  </div>

                  {editandoParticipante === participante.id ? (
                    // 🆕 Modo Edición
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombres *
                        </label>
                        <input
                          type="text"
                          value={participanteEditado.nombres}
                          onChange={(e) => setParticipanteEditado({ ...participanteEditado, nombres: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nombres"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          value={participanteEditado.apellidos}
                          onChange={(e) => setParticipanteEditado({ ...participanteEditado, apellidos: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Apellidos"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          DNI (no editable)
                        </label>
                        <input
                          type="text"
                          value={participanteEditado.dni}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={participanteEditado.email}
                          onChange={(e) => setParticipanteEditado({ ...participanteEditado, email: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={participanteEditado.telefono}
                          onChange={(e) => setParticipanteEditado({ ...participanteEditado, telefono: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="999 999 999"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Importante:</strong> Los cambios solo afectan los datos del participante. Los certificados ya generados mantendrán el nombre original.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Vista Normal
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
                  )}
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
