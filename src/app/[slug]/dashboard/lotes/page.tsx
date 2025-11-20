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
  XCircle,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import BrandColors from '@/components/BrandColors';

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

interface Empresa {
  id: number;
  slug: string;
  nombre: string;
  color_primario: string;
  color_secundario: string;
}

export default function LotesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [descargandoZip, setDescargandoZip] = useState<number | null>(null);

  useEffect(() => {
    loadEmpresa();
    loadLotes();
  }, [page]);

  const loadEmpresa = async () => {
    try {
      const response = await fetch(`/api/dashboard/${slug}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEmpresa(data.empresa);
      }
    } catch (error) {
      console.error('Error al cargar empresa:', error);
    }
  };

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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificados-lote-${loteId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && lotes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando lotes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {empresa && <BrandColors colorPrimario={empresa.color_primario} colorSecundario={empresa.color_secundario} />}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/${slug}/dashboard`)}
              className="flex items-center gap-2 text-gray-600 hover-brand mb-6 px-4 py-2 rounded-xl transition-all font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-1">
                    Historial de Lotes
                  </h1>
                  <p className="text-gray-600 font-medium">
                    Gestiona y descarga todos tus lotes de certificados
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-sm border border-gray-100">
                <Sparkles className="w-5 h-5 text-brand" />
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Total de lotes</p>
                  <p className="text-2xl font-bold text-gray-900">{lotes.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Lotes */}
          {lotes.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-brand-soft rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-brand" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No hay lotes generados aún
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Comienza generando tu primer lote de certificados desde el dashboard principal
              </p>
              <button
                onClick={() => router.push(`/${slug}/dashboard`)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-brand text-white rounded-xl hover:shadow-xl transition-all font-semibold transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Ir al Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {lotes.map((lote, index) => (
                <div
                  key={lote.id}
                  className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 relative overflow-hidden"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Decoración de fondo */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-brand opacity-5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Info del Lote - Columna Izquierda */}
                    <div className="lg:col-span-7">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-brand-soft rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="w-7 h-7 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                            {lote.nombreArchivo}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{formatearFecha(lote.fechaProcesado)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas - Columna Central */}
                    <div className="lg:col-span-3">
                      <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                          <p className="text-xs text-gray-500 font-semibold mb-1">Total</p>
                          <p className="text-2xl font-bold text-gray-900">{lote.totalCertificados}</p>
                        </div>
                       
                      </div>
                    </div>

                    {/* Acciones - Columna Derecha */}
                    <div className="lg:col-span-2 flex flex-col gap-3">
                      <button
                        onClick={() => verCertificados(lote.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-brand text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden xl:inline">Ver Detalles</span>
                      </button>
                      <button
                        onClick={() => descargarZip(lote.id)}
                        disabled={descargandoZip === lote.id}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {descargandoZip === lote.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden xl:inline">Generando...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="hidden xl:inline">Descargar ZIP</span>
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
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                Anterior
              </button>
              <span className="px-6 py-2 bg-gradient-brand text-white rounded-xl font-bold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}
