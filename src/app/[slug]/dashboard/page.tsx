'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FileText,
  Calendar,
  TrendingUp,
  Loader2,
  LogOut,
  Download,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Type,
  PenTool,
  Eye,
  CheckCircle2,
  Package,
  ChevronRight
} from 'lucide-react';
import DescargarPlantillaExcel from './DescargarPlantillaExcel';
import PlantillaUpload from './plantillaUpload';
import SubirExcelSimple from './SubirExcelSimple';
import ConfigurarTexto from './ConfigurarTexto';
import SelectorFirmas from './SelectorFirmas';
import CertificadoPreview from './CertificadoPreview';
import * as XLSX from 'xlsx';
import LogosUpload from './logosUpload';
import type { Logo } from '@/lib/entities/Logo';
import ModalExitoCertificados from '@/components/ModalExitoCertificado/route';
import ModalLimitePlan from '@/components/ModalLimitePlan/route';
import { PlanProvider } from '@/contexts/PlanContext';
import ContadorPlan from './ContadorPlan';
import { ActualizadorPlanAuto } from './ActualizadorPlanAuto';

// ✅ INTERFACE UNIFICADA para firmas
interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  firmaUrl: string; // Solo este campo, sin opcionales
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

interface DashboardStats {
  total_certificados: number;
  certificados_mes: number;
  ultimo_lote: string | null;
}

type PasoType = 1 | 2 | 3 | 4 | 5 | 6;

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pasoActual, setPasoActual] = useState<PasoType>(1);

  // Estados de progreso
  const [plantillaExcelDescargada, setPlantillaExcelDescargada] = useState(false);
  const [plantillaImagenSubida, setPlantillaImagenSubida] = useState(false);
  const [excelSubido, setExcelSubido] = useState(false);
  const [excelValido, setExcelValido] = useState(false);
  const [textoConfigurado, setTextoConfigurado] = useState(false);
  const [firmasSeleccionadas, setFirmasSeleccionadas] = useState(false);

  // Datos del flujo
  const [plantillaUrl, setPlantillaUrl] = useState<string | null>(null);
  const [datosExcel, setDatosExcel] = useState<any[]>([]);
  const [textoEstatico, setTextoEstatico] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [curso, setCurso] = useState('');
  const [firmas, setFirmas] = useState<Firma[]>([]); // ✅ Array vacío inicial
  const [generando, setGenerando] = useState(false);
  const [resultadoGeneracion, setResultadoGeneracion] = useState<any>(null);
  const [descargandoZip, setDescargandoZip] = useState(false);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // 🆕 Estados para modal de límite de plan
  const [mostrarModalLimite, setMostrarModalLimite] = useState(false);
  const [errorLimite, setErrorLimite] = useState<{
    mensaje: string;
    disponibles: number;
    solicitados: number;
    emitidos: number;
    limite: number;
  } | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    total_certificados: 0,
    certificados_mes: 0,
    ultimo_lote: null
  });

  const loadDashboard = useCallback(async () => {
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
      setStats(data.stats);
      setLoading(false);

    } catch (error) {
      console.error('Error:', error);
      router.push(`/login/${slug}`);
    }
  }, [slug, router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const puedeAvanzarA = (paso: PasoType): boolean => {
    switch (paso) {
      case 1: return true;
      case 2: return plantillaExcelDescargada;
      case 3: return plantillaImagenSubida;
      case 4: return excelSubido && excelValido;
      case 5: return textoConfigurado;
      case 6: return firmasSeleccionadas;
      default: return false;
    }
  };

  const descargarZip = async (loteId: number) => {
    try {
      setDescargandoZip(true);

      const response = await fetch(`/api/lotes/${loteId}/descargar-zip`, {
        credentials: 'include'
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

      console.log('✅ ZIP descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar ZIP:', error);
      alert('Error al descargar el archivo ZIP');
    } finally {
      setDescargandoZip(false);
    }
  };

  // 🆕 Función para reiniciar el formulario y volver al paso 1
  const reiniciarFormulario = () => {
    // Resetear estados de pasos completados
    setPlantillaExcelDescargada(false);
    setPlantillaImagenSubida(false);
    setExcelSubido(false);
    setExcelValido(false);
    setTextoConfigurado(false);
    setFirmasSeleccionadas(false);

    // Limpiar datos
    setDatosExcel([]);
    setTextoEstatico('');
    setTipoDocumento('');
    setCurso('');
    setFirmas([]);
    setResultadoGeneracion(null);

    // Volver al paso 1
    setPasoActual(1);
    console.log('🔄 Formulario reiniciado - Listo para generar nuevo lote');
  };

  const generarCertificados = async () => {
    if (datosExcel.length === 0) {
      alert('No hay datos para generar certificados');
      return;
    }

    try {
      setGenerando(true);

      const formData = new FormData();
      formData.append('empresaId', empresa?.id.toString() ?? '0');

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      XLSX.utils.book_append_sheet(wb, ws, 'Certificados');

      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const excelBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const excelFile = new File([excelBlob], 'datos.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      formData.append('file', excelFile);

      const mapeo = {
        'nombre': 'Nombres',
        'apellido': 'Apellidos',
        'termino': 'Término',
        'dni': 'DNI',
        'correo': 'Correo Electrónico',
        'fecha': 'Fecha de Emisión',
        'horas': 'Horas Académicas',
        'fecha_inicio': 'Fecha de Inicio',
        'fecha_fin': 'Fecha de Fin',
        'tipo_documento': 'Tipo de Documento',
        'curso': 'Nombre del Curso',
        'ponente': 'Ponente'
      };

      formData.append('mapeo', JSON.stringify(mapeo));

      if (textoEstatico.trim()) {
        formData.append('textoEstatico', textoEstatico);
      }

      if (tipoDocumento) {
        formData.append('tipoDocumento', tipoDocumento);
      }
      if (curso) {
        formData.append('curso', curso);
      }

      if (firmas.length > 0) {
        const firmasIds = firmas.map(f => f.id);
        formData.append('firmasIds', JSON.stringify(firmasIds));
      }

      const response = await fetch('/api/generar-certificados', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 🆕 Capturar error de límite de plan (403)
        if (response.status === 403 && errorData.error === 'Límite de plan excedido') {
          setErrorLimite({
            mensaje: errorData.mensaje,
            disponibles: errorData.disponibles,
            solicitados: errorData.solicitados,
            emitidos: errorData.emitidos,
            limite: errorData.limite
          });
          setMostrarModalLimite(true);
          return; // No mostrar alert genérico
        }

        throw new Error(errorData.error || 'Error al generar certificados');
      }

      const resultado = await response.json();

      const resultadoFormateado = {
        certificados_generados: resultado.data?.totalGenerados || resultado.totalGenerados || datosExcel.length,
        zip_url: resultado.data?.downloadUrl || resultado.downloadUrl,
        lote_id: resultado.data?.loteId || resultado.loteId
      };

      setResultadoGeneracion(resultadoFormateado);
      await loadDashboard();

      // 🆕 Actualizar contador del plan automáticamente
      if ((window as any).__actualizarPlanGlobal) {
        await (window as any).__actualizarPlanGlobal();
      }

    setMostrarModalExito(true);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error al generar certificados: ${error.message}`);
    } finally {
      setGenerando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ✅ Validación de empresa antes de renderizar
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
    <PlanProvider>
      <ActualizadorPlanAuto />
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
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

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800">{usuario?.nombre}</p>
                <p className="text-xs text-gray-500">{usuario?.email}</p>
              </div>
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con bienvenida y acciones rápidas */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Hola, {usuario?.nombre} 👋
            </h2>
            <p className="text-gray-600">
              ¿Qué vamos a crear hoy?
            </p>
          </div>

          <button
            onClick={() => router.push(`/${slug}/lotes`)}
            className="hidden md:flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
            }}
          >
            <Package className="w-5 h-5" />
            Ver Mis Lotes
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${empresa.color_primario}15`,
                  color: empresa.color_primario
                }}
              >
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Total
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats.total_certificados.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Certificados emitidos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${empresa.color_secundario}15`,
                  color: empresa.color_secundario
                }}
              >
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Este mes
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats.certificados_mes.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Certificados nuevos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Actividad
              </span>
            </div>
            <p className="text-lg font-bold text-gray-800 mb-1">
              {stats.ultimo_lote || 'Sin actividad'}
            </p>
            <p className="text-sm text-gray-600">Último lote generado</p>
          </div>
        </div>

        {/* 🆕 CONTADOR DE PLAN */}
        <ContadorPlan />

        {/* STEPPER DE 6 PASOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Crear Nuevo Lote de Certificados
              </h3>
              <p className="text-gray-600 text-sm">
                Proceso guiado paso a paso para generar certificados profesionales
              </p>
            </div>
            <div
              className="hidden md:block px-4 py-2 rounded-lg border-2"
              style={{
                backgroundColor: `${empresa.color_primario}10`,
                borderColor: `${empresa.color_primario}40`,
                color: empresa.color_primario
              }}
            >
              <p className="text-xs font-medium">Paso {pasoActual} de 6</p>
            </div>
          </div>

          {/* INDICADORES DE PASOS - Diseño Mejorado */}
          <div className="relative mb-8">
            {/* Línea de progreso */}
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((pasoActual - 1) / 5) * 100}%`,
                  background: `linear-gradient(90deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
              <StepIndicator
                numero={1}
                titulo="Excel"
                icono={<Download className="w-5 h-5" />}
                activo={pasoActual === 1}
                completado={plantillaExcelDescargada}
                onClick={() => setPasoActual(1)}
                habilitado={true}
                colorPrimario={empresa.color_primario}
                colorSecundario={empresa.color_secundario}
              />

              <StepIndicator
                numero={2}
                titulo="Plantilla"
                icono={<ImageIcon className="w-5 h-5" />}
                activo={pasoActual === 2}
                completado={plantillaImagenSubida}
                onClick={() => puedeAvanzarA(2) && setPasoActual(2)}
                habilitado={puedeAvanzarA(2)}
                colorPrimario={empresa.color_primario}
                colorSecundario={empresa.color_secundario}
              />

              <StepIndicator
                numero={3}
                titulo="Datos"
                icono={<FileSpreadsheet className="w-5 h-5" />}
                activo={pasoActual === 3}
                completado={excelSubido}
                onClick={() => puedeAvanzarA(3) && setPasoActual(3)}
                habilitado={puedeAvanzarA(3)}
                colorPrimario={empresa.color_primario}
                colorSecundario={empresa.color_secundario}
              />

              <StepIndicator
                numero={4}
                titulo="Texto"
                icono={<Type className="w-5 h-5" />}
                activo={pasoActual === 4}
                completado={textoConfigurado}
                onClick={() => puedeAvanzarA(4) && setPasoActual(4)}
                habilitado={puedeAvanzarA(4)}
                colorPrimario={empresa.color_primario}
                colorSecundario={empresa.color_secundario}
              />

              <StepIndicator
                numero={5}
                titulo="Firmas"
                icono={<PenTool className="w-5 h-5" />}
                activo={pasoActual === 5}
                completado={firmasSeleccionadas}
                onClick={() => puedeAvanzarA(5) && setPasoActual(5)}
                habilitado={puedeAvanzarA(5)}
                colorPrimario={empresa.color_primario}
                colorSecundario={empresa.color_secundario}
              />

              <StepIndicator
                numero={6}
                titulo="Previsualizar"
                icono={<Eye className="w-5 h-5" />}
                activo={pasoActual === 6}
                completado={false}
                onClick={() => puedeAvanzarA(6) && setPasoActual(6)}
                habilitado={puedeAvanzarA(6)}
                colorPrimario={empresa.color_primario}
                colorSecundario={empresa.color_secundario}
              />
            </div>
          </div>

          {/* CONTENIDO DEL PASO ACTUAL */}
          <div className="mt-8">
            {pasoActual === 1 && (
              <div className="space-y-6">
                <DescargarPlantillaExcel />

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Configuración del Lote
                  </h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Estos datos se aplicarán a <strong>todos los certificados</strong> de este lote
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Documento <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={tipoDocumento}
                        onChange={(e) => setTipoDocumento(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccione un tipo...</option>
                        <option value="Certificado">Certificado</option>
                        <option value="Certificado de Participación">Certificado de Participación</option>
                        <option value="Certificado de Asistencia">Certificado de Asistencia</option>
                        <option value="Certificado de Aprobación">Certificado de Aprobación</option>
                        <option value="Constancia">Constancia</option>
                        <option value="Constancia de Participación">Constancia de Participación</option>
                        <option value="Diploma">Diploma</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Curso <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={curso}
                        onChange={(e) => setCurso(e.target.value)}
                        placeholder="Ej: Marketing Digital Avanzado"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      if (!tipoDocumento || !curso) {
                        alert('Por favor complete todos los campos obligatorios');
                        return;
                      }
                      setPlantillaExcelDescargada(true);
                      setPasoActual(2);
                    }}
                    className="flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105"
                    style={{
                      background: !tipoDocumento || !curso
                        ? '#9ca3af'
                        : `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                    }}
                    disabled={!tipoDocumento || !curso}
                  >
                    Siguiente Paso
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {pasoActual === 2 && (
              <div className="space-y-6">
                <PlantillaUpload
                  empresaId={empresa.id}
                  onPlantillaSubida={(url) => {
                    setPlantillaUrl(url);
                    setPlantillaImagenSubida(true);
                  }}
                />

                <LogosUpload
                  empresaId={empresa.id}
                  onLogosActualizados={(logosActualizados) => {
                    setLogos(logosActualizados);
                    console.log(`✅ Logos actualizados: ${logosActualizados.length}`);
                  }}
                />

                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                  <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Vista Previa de Ubicaciones
                  </h4>
                  <p className="text-sm text-purple-800 mb-4">
                    Los logos aparecerán en el certificado en estas posiciones:
                  </p>

                  <div className="bg-white rounded-xl p-6 border-2 border-purple-300">
                    <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <div className="absolute top-3 left-3 w-16 h-16 bg-purple-100 border-2 border-purple-400 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-700">Logo 1</span>
                      </div>

                      <div className="absolute top-3 right-3 w-16 h-16 bg-blue-100 border-2 border-blue-400 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-700">Logo 2</span>
                      </div>

                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-pink-100 border-2 border-pink-400 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-pink-700">Logo 3</span>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-400 text-sm font-medium">Área del Certificado</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs font-bold text-purple-900 mb-1">Logo 1</p>
                        <p className="text-xs text-gray-600">Superior izquierda</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs font-bold text-blue-900 mb-1">Logo 2</p>
                        <p className="text-xs text-gray-600">Superior derecha</p>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <p className="text-xs font-bold text-pink-900 mb-1">Logo 3</p>
                        <p className="text-xs text-gray-600">Centro superior</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setPasoActual(1)}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Atrás
                  </button>

                  {plantillaImagenSubida && (
                    <button
                      onClick={() => setPasoActual(3)}
                      className="flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                      }}
                    >
                      Siguiente Paso
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {pasoActual === 3 && (
              <div>
                <SubirExcelSimple
                  empresaId={empresa.id}
                  onExcelCargado={(datos) => {
                    setDatosExcel(datos);
                    setExcelSubido(true);
                  }}
                  onValidacionChange={(esValido) => {
                    setExcelValido(esValido);
                    if (!esValido) {
                      setExcelSubido(false);
                    }
                  }}
                />
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setPasoActual(2)}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Atrás
                  </button>
                  {excelSubido && excelValido && (
                    <button
                      onClick={() => setPasoActual(4)}
                      className="flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                      }}
                    >
                      Siguiente Paso
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {pasoActual === 4 && (
              <div>
                <ConfigurarTexto
                  onTextoGuardado={(texto) => {
                    setTextoEstatico(texto);
                    setTextoConfigurado(true);
                  }}
                  textoInicial={textoEstatico}
                />
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setPasoActual(3)}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Atrás
                  </button>
                  {textoConfigurado && (
                    <button
                      onClick={() => setPasoActual(5)}
                      className="flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                      }}
                    >
                      Siguiente Paso
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ✅ PASO 5 - SELECTOR DE FIRMAS CORREGIDO */}
            {pasoActual === 5 && (
              <div>
                <SelectorFirmas
                  empresaId={empresa.id}
                  onFirmasSeleccionadas={(firmasSelec) => {
                    setFirmas(firmasSelec);
                    setFirmasSeleccionadas(true);
                  }}
                  firmasInicial={firmas}
                />
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setPasoActual(4)}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Atrás
                  </button>
                  {firmasSeleccionadas && (
                    <button
                      onClick={() => setPasoActual(6)}
                      className="flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${empresa.color_primario}, ${empresa.color_secundario})`
                      }}
                    >
                      Vista Previa Final
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {pasoActual === 6 && (
              <div>
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Eye className="w-7 h-7 text-blue-600" />
                    Vista Previa del Certificado
                  </h4>

                  {datosExcel.length > 0 ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="bg-white rounded-lg p-4 mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          📄 Datos del primer participante (ejemplo):
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Nombre:</span>
                            <p className="font-bold text-gray-800">
                              {datosExcel[0]['Término']} {datosExcel[0]['Nombres']} {datosExcel[0]['Apellidos']}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Curso:</span>
                            <p className="font-bold text-gray-800">{curso}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Fecha:</span>
                            <p className="font-bold text-gray-800">
                              {typeof datosExcel[0]['Fecha de Emisión'] === 'number' 
                                ? new Date((datosExcel[0]['Fecha de Emisión'] - 25569) * 86400 * 1000).toLocaleDateString('es-PE')
                                : datosExcel[0]['Fecha de Emisión']}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Horas:</span>
                            <p className="font-bold text-gray-800">
                              {typeof datosExcel[0]['Horas Académicas'] === 'number' 
                                ? Math.round(datosExcel[0]['Horas Académicas'])
                                : datosExcel[0]['Horas Académicas']}
                            </p>
                          </div>
                        </div>
                      </div>

                      <CertificadoPreview
                        plantillaUrl={plantillaUrl}
                        datosParticipante={datosExcel[0]}
                        textoEstatico={textoEstatico}
                        firmas={firmas.map(f => ({ 
                          id: f.id, 
                          nombre: f.nombre, 
                          cargo: f.cargo, 
                          url: f.firmaUrl 
                        }))}
                        logos={logos}
                        tipoDocumento={tipoDocumento}
                        curso={curso}
                      />
                    </div>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                      <p className="text-red-800 font-semibold">⚠️ No hay datos del Excel cargados</p>
                    </div>
                  )}
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                  <h5 className="font-bold text-gray-800 mb-4 text-lg">📋 Resumen del Lote</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total de certificados:</p>
                      <p className="text-2xl font-bold text-blue-600">{datosExcel.length}</p>
                    </div>
                    {datosExcel.length > 0 && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Tipo de documento:</p>
                          <p className="text-lg font-bold text-gray-800">{tipoDocumento}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Curso:</p>
                          <p className="text-lg font-bold text-gray-800">{curso}</p>
                        </div>
                        {datosExcel[0]['Ponente'] && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">Ponente:</p>
                            <p className="text-lg font-bold text-gray-800">{datosExcel[0]['Ponente']}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {firmas.length > 0 && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
                    <h5 className="font-bold text-indigo-900 mb-4 text-lg">✍️ Firmas que aparecerán:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {firmas.map((firma, index) => (
                        <div key={firma.id} className="bg-white rounded-lg p-4 border border-indigo-300">
                          <div className="text-xs text-indigo-600 font-semibold mb-2">Firma {index + 1}</div>
                          <p className="text-sm font-bold text-gray-800">{firma.nombre}</p>
                          <p className="text-xs text-gray-600">{firma.cargo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultadoGeneracion && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <div>
                        <h5 className="font-bold text-green-800 text-lg">¡Certificados generados exitosamente!</h5>
                        <p className="text-sm text-green-700">
                          Se generaron {resultadoGeneracion.certificados_generados} certificados
                        </p>
                      </div>
                    </div>
                    {resultadoGeneracion.lote_id && (
                      <button
                        onClick={() => descargarZip(resultadoGeneracion.lote_id)}
                        disabled={descargandoZip}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {descargandoZip ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generando ZIP...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Descargar ZIP con todos los certificados
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div className="text-center py-8">
                  <button
                    onClick={generarCertificados}
                    disabled={generando || datosExcel.length === 0}
                    className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-xl transition-all text-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {generando ? (
                      <>
                        <Loader2 className="w-7 h-7 inline mr-3 animate-spin" />
                        Generando certificados...
                      </>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 inline mr-3" />
                        Generar {datosExcel.length} Certificados Masivos
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    {generando
                      ? 'Por favor espera, esto puede tomar unos minutos...'
                      : 'Se generarán PDFs individuales con QR único para cada participante'
                    }
                  </p>
                </div>

                <div className="flex justify-start mt-6">
                  <button
                    onClick={() => setPasoActual(5)}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Atrás
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by <strong>VAXA</strong> - Sistema de Certificados con Validación</p>
        </div>
      </main>
          <ModalExitoCertificados
      isOpen={mostrarModalExito}
      onClose={() => setMostrarModalExito(false)}
      totalGenerados={resultadoGeneracion?.certificados_generados || 0}
      onDescargarZip={
        resultadoGeneracion?.lote_id
          ? () => descargarZip(resultadoGeneracion.lote_id)
          : undefined
      }
      onNuevoLote={reiniciarFormulario}
    />

      {/* 🆕 Modal de Límite de Plan */}
      {errorLimite && (
        <ModalLimitePlan
          isOpen={mostrarModalLimite}
          onClose={() => setMostrarModalLimite(false)}
          mensaje={errorLimite.mensaje}
          disponibles={errorLimite.disponibles}
          solicitados={errorLimite.solicitados}
          emitidos={errorLimite.emitidos}
          limite={errorLimite.limite}
        />
      )}
    </div>
    </PlanProvider>
  );
}

// ✅ Componente auxiliar para los indicadores de paso - Diseño mejorado
function StepIndicator({
  numero,
  titulo,
  icono,
  activo,
  completado,
  onClick,
  habilitado,
  colorPrimario,
  colorSecundario
}: {
  numero: number;
  titulo: string;
  icono: React.ReactNode;
  activo: boolean;
  completado: boolean;
  onClick: () => void;
  habilitado: boolean;
  colorPrimario: string;
  colorSecundario: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!habilitado}
      className={`relative rounded-xl p-4 transition-all duration-300 ${
        activo
          ? 'text-white shadow-xl scale-105 transform'
          : completado
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 text-green-700'
            : habilitado
              ? 'bg-white border-2 border-gray-200 hover:shadow-md'
              : 'bg-gray-50 border-2 border-gray-200 opacity-40 cursor-not-allowed'
      }`}
      style={
        activo
          ? { background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})` }
          : habilitado && !completado
            ? { borderColor: 'rgb(229, 231, 235)' }
            : undefined
      }
      onMouseEnter={(e) => {
        if (habilitado && !activo && !completado) {
          e.currentTarget.style.borderColor = colorPrimario;
        }
      }}
      onMouseLeave={(e) => {
        if (habilitado && !activo && !completado) {
          e.currentTarget.style.borderColor = 'rgb(229, 231, 235)';
        }
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
            completado
              ? 'bg-green-500 text-white shadow-md'
              : activo
                ? 'bg-white/20 backdrop-blur-sm text-white'
                : habilitado
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-gray-200 text-gray-400'
          }`}
        >
          {completado ? <CheckCircle2 className="w-6 h-6" /> : icono}
        </div>
        <div className="text-center">
          <p
            className={`text-xs font-bold mb-0.5 ${
              activo ? 'text-white' : completado ? 'text-green-700' : habilitado ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            Paso {numero}
          </p>
          <p
            className={`text-xs font-medium ${
              activo ? 'text-white/90' : completado ? 'text-green-600' : habilitado ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            {titulo}
          </p>
        </div>
      </div>
    </button>
  );
}