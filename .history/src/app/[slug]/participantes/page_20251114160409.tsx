'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, User, FileText, Calendar, Download, Eye, Loader2, ArrowLeft, Edit2, Save, X, RefreshCw, Package, Users, AlertCircle, LogOut } from 'lucide-react';
import Image from 'next/image';

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

interface Empresa {
  id: number;
  slug: string;
  nombre: string;
  logo: string | null;
  color_primario: string;
  color_secundario: string;
}

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  role: string;
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
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Estados para edición de certificados
  const [editandoCertificado, setEditandoCertificado] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [regenerando, setRegenerando] = useState<number | null>(null);

  // Estados para edición de participante
  const [editandoParticipante, setEditandoParticipante] = useState<number | null>(null);
  const [participanteEditado, setParticipanteEditado] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: ''
  });
  const [guardandoParticipante, setGuardandoParticipante] = useState(false);

  // Obtener datos de empresa y usuario
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(`/api/dashboard/${slug}`, {
          credentials: 'include'
        });

        if (response.status === 401) {
          router.push(`/login/${slug}`);
          return;
        }

        if (!response.ok) {
          throw new Error('Error al cargar dashboard');
        }

        const data = await response.json();
        setEmpresa(data.empresa);
        setUsuario(data.usuario);
        setEmpresaId(data.empresa.id);
        console.log('📌 Empresa ID cargado:', data.empresa.id);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        router.push(`/login/${slug}`);
      }
    };

    loadDashboard();
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

  const iniciarEdicionParticipante = (participante: Participante) => {
    setEditandoParticipante(participante.id);
    const nombreCompleto = participante.nombre.split(' ');
    const apellidos = nombreCompleto.slice(-2).join(' ');
    const nombres = nombreCompleto.slice(0, -2).join(' ') || nombreCompleto[0];

    setParticipanteEditado({
      nombres: nombres,
      apellidos: apellidos,
      email: participante.email || '',
      telefono: participante.telefono || '',
      dni: participante.dni
    });
  };

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

      setParticipantes(prevParticipantes =>
        prevParticipantes.map(p =>
          p.id === participanteId
            ? {
                ...p,
                nombre: `${participanteEditado.nombres} ${participanteEditado.apellidos}`.trim(),
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

    async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push(`/login/${slug}`);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  const guardarYRegenerar = async (certificadoId: number) => {
    if (!nombreEditado.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setRegenerando(certificadoId);

    try {
      console.log(`✏️ Guardando nombre para certificado ${certificadoId}: "${nombreEditado}"`);

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

      setParticipantes(prevParticipantes =>
        prevParticipantes.map(p => ({
          ...p,
          certificados: p.certificados.map(cert =>
            cert.id === certificadoId
              ? { 
                  ...cert, 
                  nombre_actual: nombreEditado, 
                  tiene_override: true,
                  pdf_url: regenResult.data.rutaArchivo || cert.pdf_url
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error: No se pudo cargar la información de la empresa</p>
          <button 
            onClick={() => router.push(`/login/${slug}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* HEADER - Idéntico al dashboard */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {empresa.logo ? (
                <Image
                  src={empresa.logo}
                  alt={empresa.nombre}
                  width={40}
                  height={40}
                  className="rounded-xl object-cover shadow-sm border-2 border-gray-100"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                  }}
                >
                  {empresa.nombre.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-800">{empresa.nombre}</h1>
                <p className="text-xs text-gray-500">Sistema de Certificados</p>
              </div>
            </div>

            {/* MENÚ DE NAVEGACIÓN */}
            <nav className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/${slug}/dashboard`)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all font-medium shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => router.push(`/${slug}/dashboard/lotes`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-medium"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Historial</span>
              </button>
            </nav>

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800">{usuario?.nombre}</p>
              <p className="text-xs text-gray-500">{usuario?.email}</p>
                <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con título */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <Users className="w-8 h-8" style={{ color: empresa.color_primario }} />
              Buscar Participantes
            </h2>
            <p className="text-gray-600">
              Encuentra y gestiona la información de tus participantes
            </p>
          </div>
        </div>

        {/* BUSCADOR - Estilo mejorado */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${empresa.color_primario}15, ${empresa.color_secundario}15)`
              }}
            >
              <Search className="w-6 h-6" style={{ color: empresa.color_primario }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Buscar Participante</h3>
              <p className="text-sm text-gray-600">Ingresa DNI o nombre completo</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Buscar por DNI o nombre completo..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none transition-all text-base"
                style={{
                  focusBorderColor: empresa.color_primario
                }}
                onFocus={(e) => e.target.style.borderColor = empresa.color_primario}
                onBlur={(e) => e.target.style.borderColor = 'rgb(209, 213, 219)'}
              />
            </div>
            <button
              onClick={buscarParticipante}
              disabled={buscando}
              className="px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
              }}
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
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 text-center shadow-sm">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${empresa.color_primario}20, ${empresa.color_secundario}20)`
              }}
            >
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Participante no encontrado
            </h3>
            <p className="text-gray-700 text-lg">
              No se encontró ningún participante con: <strong className="text-gray-900">"{terminoBusqueda}"</strong>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Verifica que el DNI o nombre sean correctos
            </p>
          </div>
        )}

        {/* RESULTADOS */}
        {participantes.length > 0 && (
          <div className="space-y-8">
            {/* Badge de resultados */}
            <div 
              className="rounded-xl p-4 border-2 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${empresa.color_primario}10, ${empresa.color_secundario}10)`,
                borderColor: `${empresa.color_primario}40`
              }}
            >
              <p className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: empresa.color_primario }} />
                Se {participantes.length === 1 ? 'encontró' : 'encontraron'} <span style={{ color: empresa.color_primario }}>{participantes.length}</span> participante{participantes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {participantes.map((participante) => (
              <div key={participante.id} className="space-y-6">
                {/* INFO DEL PARTICIPANTE */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                        }}
                      >
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Información del Participante</h3>
                        <p className="text-sm text-gray-600">DNI: {participante.dni}</p>
                      </div>
                    </div>
                    {editandoParticipante === participante.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarParticipante(participante.id)}
                          disabled={guardandoParticipante}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEdicionParticipante(participante)}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-md font-medium"
                        style={{
                          background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar Datos
                      </button>
                    )}
                  </div>

                  {editandoParticipante === participante.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombres *
                          </label>
                          <input
                            type="text"
                            value={participanteEditado.nombres}
                            onChange={(e) => setParticipanteEditado({ ...participanteEditado, nombres: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
                            placeholder="Nombres"
                            style={{ borderColor: empresa.color_primario }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Apellidos *
                          </label>
                          <input
                            type="text"
                            value={participanteEditado.apellidos}
                            onChange={(e) => setParticipanteEditado({ ...participanteEditado, apellidos: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
                            placeholder="Apellidos"
                            style={{ borderColor: empresa.color_primario }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            DNI (no editable)
                          </label>
                          <input
                            type="text"
                            value={participanteEditado.dni}
                            disabled
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={participanteEditado.email}
                            onChange={(e) => setParticipanteEditado({ ...participanteEditado, email: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
                            placeholder="correo@ejemplo.com"
                            style={{ borderColor: empresa.color_primario }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={participanteEditado.telefono}
                            onChange={(e) => setParticipanteEditado({ ...participanteEditado, telefono: e.target.value })}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
                            placeholder="999 999 999"
                            style={{ borderColor: empresa.color_primario }}
                          />
                        </div>
                      </div>
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span><strong>Importante:</strong> Los cambios solo afectan los datos del participante. Los certificados ya generados mantendrán el nombre original.</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm font-medium text-gray-600 mb-1">Nombre Completo</p>
                        <p className="text-lg font-bold text-gray-900">{participante.nombre}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm font-medium text-gray-600 mb-1">DNI</p>
                        <p className="text-lg font-bold text-gray-900">{participante.dni}</p>
                      </div>
                      {participante.email && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                          <p className="text-lg font-bold text-gray-900">{participante.email}</p>
                        </div>
                      )}
                      {participante.telefono && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-1">Teléfono</p>
                          <p className="text-lg font-bold text-gray-900">{participante.telefono}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CERTIFICADOS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${empresa.color_primario}15, ${empresa.color_secundario}15)`
                        }}
                      >
                        <FileText className="w-6 h-6" style={{ color: empresa.color_primario }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          Certificados ({participante.certificados.length})
                        </h3>
                        <p className="text-sm text-gray-600">Documentos emitidos</p>
                      </div>
                    </div>
                  </div>

                  {participante.certificados.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium text-lg">
                        Este participante aún no tiene certificados generados
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {participante.certificados.map((cert) => (
                        <div
                          key={cert.id}
                          className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                          style={{
                            borderColor: editandoCertificado === cert.id ? empresa.color_primario : undefined
                          }}
                        >
                          {/* Header del certificado */}
                          <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-600">Código:</span>
                                <span 
                                  className="text-lg font-bold px-3 py-1 rounded-lg"
                                  style={{
                                    color: empresa.color_primario,
                                    background: `${empresa.color_primario}15`
                                  }}
                                >
                                  {cert.codigo_unico}
                                </span>
                                {cert.tiene_override && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                                    ✏️ Personalizado
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Tipo de Documento</p>
                                  <p className="text-sm font-bold text-gray-900">{cert.tipo_documento || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Curso</p>
                                  <p className="text-sm font-bold text-gray-900">{cert.curso || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <a
                                href={cert.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </a>
                              <a
                                href={cert.pdf_url}
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md text-sm font-medium"
                              >
                                <Download className="w-4 h-4" />
                                Descargar
                              </a>
                            </div>
                          </div>

                          {/* Edición de nombre */}
                          <div className="pt-4">
                            {editandoCertificado === cert.id ? (
                              <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                  Editar nombre en el certificado:
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={nombreEditado}
                                    onChange={(e) => setNombreEditado(e.target.value)}
                                    className="flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-all"
                                    placeholder="Nombre completo..."
                                    disabled={regenerando === cert.id}
                                    style={{ borderColor: empresa.color_primario }}
                                  />
                                  <button
                                    onClick={() => guardarYRegenerar(cert.id)}
                                    disabled={regenerando === cert.id}
                                    className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {regenerando === cert.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Regenerando...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-4 h-4" />
                                        Guardar y Regenerar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={cancelarEdicion}
                                    disabled={regenerando === cert.id}
                                    className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
                                  >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                  </button>
                                </div>
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                                  <p className="text-xs text-blue-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>Al guardar se regenerará automáticamente el PDF con el nuevo nombre</span>
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Nombre en el certificado:</p>
                                  <p className="text-base font-bold text-gray-900">{cert.nombre_actual}</p>
                                </div>
                                <button
                                  onClick={() => iniciarEdicion(cert)}
                                  className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-md font-medium"
                                  style={{
                                    background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Editar Nombre
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Footer con info adicional */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Generado: {new Date(cert.fecha_emision).toLocaleDateString('es-PE', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                              <div className="h-4 w-px bg-gray-300"></div>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span>Lote #{cert.lote_id}</span>
                              </div>
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

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Powered by <strong className="text-gray-700">VAXA</strong> - Sistema de Certificados con Validación
          </p>
        </div>
      </main>
    </div>
  );
}