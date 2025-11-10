'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Download,
  Edit2,
  ArrowLeft,
  Loader2,
  X,
  Save,
  Eye,
  User,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

interface Participante {
  id: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  termino?: string | null;
  tipoDocumento?: string;
}

interface Curso {
  id: number;
  nombre: string;
  horasAcademicas: number | null;
  ponente: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  modalidad?: string | null;
}

interface Certificado {
  id: number;
  codigo: string;
  archivoUrl: string;
  fechaEmision: string;
  estado: string;
  participanteId: number | null;
  cursoId: number | null;
  participante: Participante | null;
  curso: Curso | null;
  datosAdicionales: Record<string, string>;
}

export default function CertificadosLotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const loteId = parseInt(params.loteId as string);

  const [loading, setLoading] = useState(true);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<Certificado | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Estados para edición
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState<any>({});

  useEffect(() => {
    loadCertificados();
  }, [page, busqueda]);

  const loadCertificados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const url = `/api/lotes/${loteId}/certificados?page=${page}&limit=50${busqueda ? `&busqueda=${encodeURIComponent(busqueda)}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        router.push(`/login/${slug}`);
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar certificados');
      }

      const data = await response.json();

      if (data.success) {
        setCertificados(data.data.certificados);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Error al cargar certificados:', error);
      alert('Error al cargar los certificados');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCertificado = async (cert: Certificado) => {
    try {
      const token = localStorage.getItem('token');

      // Obtener datos completos del certificado
      const response = await fetch(`/api/certificados/${cert.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener certificado');
      }

      const data = await response.json();

      if (data.success) {
        setCertificadoSeleccionado(data.data);
        setDatosEdicion(data.data);
        setEditando(false);
      }
    } catch (error) {
      console.error('Error al obtener certificado:', error);
      alert('Error al obtener los detalles del certificado');
    }
  };

  const descargarCertificado = async (certificadoId: number) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/certificados/${certificadoId}/descargar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar certificado');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${certificadoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el certificado');
    }
  };

  const guardarEdicion = async () => {
    if (!certificadoSeleccionado) return;

    try {
      setGuardando(true);
      const token = localStorage.getItem('token');

      const body = {
        participante: datosEdicion.participante ? {
          nombres: datosEdicion.participante.nombres,
          apellidos: datosEdicion.participante.apellidos,
          numeroDocumento: datosEdicion.participante.numeroDocumento,
          correo: datosEdicion.participante.correo,
          telefono: datosEdicion.participante.telefono,
          ciudad: datosEdicion.participante.ciudad,
          termino: datosEdicion.participante.termino,
          tipoDocumento: datosEdicion.participante.tipoDocumento
        } : null,
        curso: datosEdicion.curso ? {
          nombre: datosEdicion.curso.nombre,
          horasAcademicas: datosEdicion.curso.horasAcademicas,
          ponente: datosEdicion.curso.ponente,
          fechaInicio: datosEdicion.curso.fechaInicio,
          fechaFin: datosEdicion.curso.fechaFin,
          modalidad: datosEdicion.curso.modalidad
        } : null,
        datosAdicionales: datosEdicion.datosAdicionales || {}
      };

      const response = await fetch(`/api/certificados/${certificadoSeleccionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }

      const data = await response.json();

      if (data.success) {
        alert('Certificado actualizado exitosamente. El PDF ha sido regenerado.');
        setCertificadoSeleccionado(data.data);
        setDatosEdicion(data.data);
        setEditando(false);
        loadCertificados(); // Recargar lista
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCertificados();
  };

  if (loading && certificados.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando certificados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex h-screen">
        {/* Panel Izquierdo - Lista de Certificados */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => router.push(`/${slug}/lotes`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a Lotes
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Certificados
            </h1>
            <p className="text-sm text-gray-600">
              {total} certificados en total
            </p>

            {/* Búsqueda */}
            <form onSubmit={handleBusqueda} className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o documento..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Lista de Certificados */}
          <div className="flex-1 overflow-y-auto">
            {certificados.map((cert) => (
              <div
                key={cert.id}
                onClick={() => seleccionarCertificado(cert)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  certificadoSeleccionado?.id === cert.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {cert.participante
                        ? `${cert.participante.nombres} ${cert.participante.apellidos}`
                        : 'Sin participante'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Código: {cert.codigo}
                    </p>
                    {cert.participante?.numeroDocumento && (
                      <p className="text-xs text-gray-500 mt-1">
                        Doc: {cert.participante.numeroDocumento}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      descargarCertificado(cert.id);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {certificados.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No se encontraron certificados
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Panel Derecho - Visualizador y Editor */}
        <div className="flex-1 flex flex-col">
          {certificadoSeleccionado ? (
            <>
              {/* Header del Certificado */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {certificadoSeleccionado.codigo}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Emitido: {new Date(certificadoSeleccionado.fechaEmision).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!editando ? (
                      <button
                        onClick={() => setEditando(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditando(false);
                            setDatosEdicion(certificadoSeleccionado);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                        <button
                          onClick={guardarEdicion}
                          disabled={guardando}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {guardando ? (
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Visualizador PDF */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Vista Previa del PDF</h3>
                    </div>
                    <button
                      onClick={() => descargarCertificado(certificadoSeleccionado.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </button>
                  </div>
                  <div className="p-4">
                    <iframe
                      src={certificadoSeleccionado.archivoUrl}
                      className="w-full h-[500px] border border-gray-200 rounded-lg"
                      title="Vista previa del certificado"
                    />
                  </div>
                </div>

                {/* Datos del Participante */}
                {certificadoSeleccionado.participante && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">Datos del Participante</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                        {editando ? (
                          <input
                            type="text"
                            value={datosEdicion.participante?.nombres || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              participante: { ...datosEdicion.participante, nombres: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.participante.nombres}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                        {editando ? (
                          <input
                            type="text"
                            value={datosEdicion.participante?.apellidos || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              participante: { ...datosEdicion.participante, apellidos: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.participante.apellidos}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                        {editando ? (
                          <input
                            type="text"
                            value={datosEdicion.participante?.numeroDocumento || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              participante: { ...datosEdicion.participante, numeroDocumento: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.participante.numeroDocumento}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                        {editando ? (
                          <input
                            type="email"
                            value={datosEdicion.participante?.correo || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              participante: { ...datosEdicion.participante, correo: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.participante.correo || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Datos del Curso */}
                {certificadoSeleccionado.curso && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">Datos del Curso</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso</label>
                        {editando ? (
                          <input
                            type="text"
                            value={datosEdicion.curso?.nombre || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              curso: { ...datosEdicion.curso, nombre: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.curso.nombre}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Horas Académicas</label>
                        {editando ? (
                          <input
                            type="number"
                            value={datosEdicion.curso?.horasAcademicas || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              curso: { ...datosEdicion.curso, horasAcademicas: parseInt(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.curso.horasAcademicas || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ponente</label>
                        {editando ? (
                          <input
                            type="text"
                            value={datosEdicion.curso?.ponente || ''}
                            onChange={(e) => setDatosEdicion({
                              ...datosEdicion,
                              curso: { ...datosEdicion.curso, ponente: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <p className="text-gray-900">{certificadoSeleccionado.curso.ponente || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Selecciona un certificado para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
