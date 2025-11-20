'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  FileText,
  Download,
  Eye,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Lote {
  id: number;
  nombreArchivo: string;
  cantidadCertificados: number;
  fechaProcesado: string;
  totalCertificados: number;
  certificadosActivos: number;
  certificadosRevocados: number;
  tieneZip: boolean;
}

export default function LotesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [descargandoZip, setDescargandoZip] = useState<number | null>(null);

  useEffect(() => {
    loadLotes();
  }, [page]);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/lotes?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        router.push(`/login/${slug}`);
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar lotes');
      }

      const data = await response.json();

      if (data.success) {
        setLotes(data.data.lotes);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Error al cargar lotes:', error);
      alert('Error al cargar los lotes');
    } finally {
      setLoading(false);
    }
  };

  const descargarZip = async (loteId: number) => {
    try {
      setDescargandoZip(loteId);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/lotes/${loteId}/descargar-zip`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar ZIP');
      }

      // Obtener el blob directamente desde la respuesta
      const blob = await response.blob();

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificados-lote-${loteId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Actualizar el lote para indicar que ahora tiene ZIP
      loadLotes();
    } catch (error) {
      console.error('Error al descargar ZIP:', error);
      alert('Error al descargar el archivo ZIP');
    } finally {
      setDescargandoZip(null);
    }
  };

  const verCertificados = (loteId: number) => {
    router.push(`/${slug}/lotes/${loteId}/certificados`);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && lotes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando lotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${slug}/dashboard`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Lotes
              </h1>
              <p className="text-gray-600 mt-1">
                Administra todos tus lotes de certificados
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Lotes */}
        {lotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay lotes aún
            </h3>
            <p className="text-gray-600 mb-6">
              Genera tu primer lote de certificados desde el dashboard
            </p>
            <button
              onClick={() => router.push(`/${slug}/dashboard`)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Ir al Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {lotes.map((lote) => (
              <div
                key={lote.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Info del Lote */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lote.nombreArchivo}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatearFecha(lote.fechaProcesado)}
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {lote.totalCertificados}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <p className="text-xs text-green-600">Activos</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {lote.certificadosActivos}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <p className="text-xs text-red-600">Revocados</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          {lote.certificadosRevocados}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => verCertificados(lote.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Certificados
                    </button>

                    <button
                      onClick={() => descargarZip(lote.id)}
                      disabled={descargandoZip === lote.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {descargandoZip === lote.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Descargar ZIP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
