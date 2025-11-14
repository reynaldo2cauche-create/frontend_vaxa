// src/app/[slug]/lotes/[loteId]/certificados/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Download,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  Eye,
  RefreshCw
} from 'lucide-react';

interface Participante {
  certificado_id: number;
  codigo: string;
  participante_id: number;
  termino: string | null;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  correo_electronico: string | null;
  curso: string;
  horas: number;
  fecha_emision: string;
  estado: 'activo' | 'revocado';
  archivo_url: string;
  datos_adicionales: Record<string, string>;
  nombre_actual?: string;
  tiene_override?: boolean;
}

interface EditingParticipant {
  id: number;
  termino: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
}

function PdfPreviewModal({ 
  isOpen, 
  onClose, 
  certificadoId,
  codigo 
}: { 
  isOpen: boolean;
  onClose: () => void;
  certificadoId: number;
  codigo: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = `/api/certificados/${certificadoId}/preview`;

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/certificados/${certificadoId}/descargar`, {
        credentials: 'include'
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-${codigo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el certificado');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Vista previa - {codigo}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando certificado...</span>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Error al cargar el PDF</p>
                <p className="text-gray-600 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('No se pudo cargar el documento PDF');
            }}
            title={`Certificado ${codigo}`}
          />
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Vista previa generada en tiempo real
          </p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantesLotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const loteId = params.loteId as string;

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [filteredParticipantes, setFilteredParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'activo' | 'revocado'>('todos');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditingParticipant | null>(null);
  const [saving, setSaving] = useState(false);

  // 🆕 Estados para edición de nombre en certificado
  const [editandoCertificado, setEditandoCertificado] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [regenerando, setRegenerando] = useState<number | null>(null);

  const [sortField, setSortField] = useState<'nombre' | 'documento' | 'fecha'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [previewPdf, setPreviewPdf] = useState<{
    isOpen: boolean;
    certificadoId: number;
    codigo: string;
  }>({
    isOpen: false,
    certificadoId: 0,
    codigo: ''
  });

  useEffect(() => {
    loadParticipantes();
  }, [loteId]);

  useEffect(() => {
    filterAndSortParticipantes();
    setCurrentPage(1);
  }, [participantes, searchTerm, estadoFiltro, sortField, sortOrder]);

  const loadParticipantes = async () => {
    try {
      const res = await fetch(`/api/lotes/${loteId}/certificados`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setParticipantes(Array.isArray(data.data.certificados) ? data.data.certificados : []);
      }
    } catch (error) {
      console.error('Error al cargar participantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortParticipantes = () => {
    let filtered = [...participantes];

    if (estadoFiltro !== 'todos') {
      filtered = filtered.filter(p => p.estado === estadoFiltro);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre_completo.toLowerCase().includes(term) ||
        p.numero_documento.includes(term) ||
        (p.correo_electronico?.toLowerCase().includes(term))
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'nombre':
          comparison = a.apellidos.localeCompare(b.apellidos);
          break;
        case 'documento':
          comparison = a.numero_documento.localeCompare(b.numero_documento);
          break;
        case 'fecha':
          comparison = new Date(a.fecha_emision).getTime() - new Date(b.fecha_emision).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredParticipantes(filtered);
  };

  const startEdit = (participante: Participante) => {
    setEditingId(participante.participante_id);
    setEditData({
      id: participante.participante_id,
      termino: participante.termino || '',
      nombres: participante.nombres,
      apellidos: participante.apellidos,
      correo_electronico: participante.correo_electronico || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = async () => {
    if (!editData) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/participantes/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          participante_id: editData.id,
          termino: editData.termino || null,
          nombres: editData.nombres,
          apellidos: editData.apellidos,
          correo_electronico: editData.correo_electronico || null
        })
      });

      if (res.ok) {
        await loadParticipantes();
        setEditingId(null);
        setEditData(null);
        alert('✅ Participante actualizado correctamente');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al actualizar el participante');
    } finally {
      setSaving(false);
    }
  };

  // 🆕 Funciones para edición de certificado (igual que en participantes)
  const iniciarEdicionCertificado = (participante: Participante) => {
    setEditandoCertificado(participante.certificado_id);
    setNombreEditado(participante.nombre_actual || participante.nombre_completo);
  };

  const cancelarEdicionCertificado = () => {
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
        prevParticipantes.map(p =>
          p.certificado_id === certificadoId
            ? { 
                ...p, 
                nombre_actual: nombreEditado, 
                tiene_override: true,
                archivo_url: regenResult.data.rutaArchivo || p.archivo_url
              }
            : p
        )
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

  const downloadCertificate = async (certificadoId: number, codigo: string) => {
    try {
      const res = await fetch(`/api/certificados/${certificadoId}/descargar`, {
        credentials: 'include'
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-${codigo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el certificado');
    }
  };

  const previewCertificate = (certificadoId: number, codigo: string) => {
    setPreviewPdf({
      isOpen: true,
      certificadoId,
      codigo
    });
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = {
    total: participantes.length,
    activos: participantes.filter(p => p.estado === 'activo').length,
    revocados: participantes.filter(p => p.estado === 'revocado').length
  };

  const totalPages = Math.ceil(filteredParticipantes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipantes = filteredParticipantes.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <PdfPreviewModal
        isOpen={previewPdf.isOpen}
        onClose={() => setPreviewPdf({ isOpen: false, certificadoId: 0, codigo: '' })}
        certificadoId={previewPdf.certificadoId}
        codigo={previewPdf.codigo}
      />

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Participantes del Lote #{loteId}
                </h1>
                <p className="text-sm text-gray-600">
                  {stats.total} participantes • {stats.activos} activos • {stats.revocados} revocados
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/${slug}/lotes`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Volver a Lotes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, DNI o correo..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Solo activos</option>
                <option value="revocado">Solo revocados</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <button
              onClick={() => toggleSort('nombre')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'nombre'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Nombre {sortField === 'nombre' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('documento')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'documento'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Documento {sortField === 'documento' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('fecha')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'fecha'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Fecha {sortField === 'fecha' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Código
                  </th>
                  
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Nombre en Certificado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentParticipantes.map((participante, index) => {
                  const isEditing = editingId === participante.participante_id;
                  const isEditingCert = editandoCertificado === participante.certificado_id;
                  const globalIndex = startIndex + index + 1;

                  return (
                    <tr
                      key={participante.certificado_id}
                      className="hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg">
                          {globalIndex}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg">
                          <FileText className="w-3 h-3" />
                          {participante.codigo}
                        </span>
                        {participante.tiene_override && (
                          <span className="block mt-1 text-xs text-purple-600">
                            ✨ Personalizado
                          </span>
                        )}
                      </td>
                  

                      <td className="px-6 py-4">
                        {isEditingCert ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={nombreEditado}
                              onChange={(e) => setNombreEditado(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Nombre completo..."
                              disabled={regenerando === participante.certificado_id}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => guardarYRegenerar(participante.certificado_id)}
                                disabled={regenerando === participante.certificado_id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium disabled:opacity-50"
                              >
                                {regenerando === participante.certificado_id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Regenerando...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3" />
                                    Guardar y Regenerar
                                  </>
                                )}
                              </button>
                              <button
                                onClick={cancelarEdicionCertificado}
                                disabled={regenerando === participante.certificado_id}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {participante.nombre_actual || participante.nombre_completo}<br><br/>
                                {participante.numero_documento}
                              </p>
                            </div>
                            <button
                              onClick={() => iniciarEdicionCertificado(participante)}
                              className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors text-xs"
                            >
                              <Edit2 className="w-3 h-3" />
                              Editar
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {participante.estado === 'activo' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Revocado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="p-2.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Guardar cambios"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="p-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                           
                            <button
                              onClick={() => previewCertificate(participante.certificado_id, participante.codigo)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all hover:shadow-sm"
                              title="Vista previa del certificado"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadCertificate(participante.certificado_id, participante.codigo)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all hover:shadow-sm"
                              title="Descargar certificado"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredParticipantes.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No se encontraron participantes
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Este lote no tiene participantes registrados'}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredParticipantes.length)} de {filteredParticipantes.length} certificados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Primera
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Última
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Consejos:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Edita los <strong>datos del participante</strong> con el botón azul (afecta registros futuros)</li>
                <li>Edita el <strong>nombre en el certificado</strong> directamente en la columna correspondiente</li>
                <li>Al editar el nombre del certificado, se regenerará automáticamente el PDF</li>
                <li>Usa el ícono de vista previa (👁️) para ver el certificado actualizado</li>
                <li>Los certificados con nombre personalizado muestran un indicador ✨</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}