'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Shield, ShieldCheck, ShieldAlert, Download, ExternalLink, Calendar, Clock, User, Building2, Award, CheckCircle2, XCircle } from 'lucide-react';

interface ResultadoValidacion {
  valido: boolean;
  estado: string;
  mensaje: string;
  certificado?: {
    codigo: string;
    nombre_certificado: string;
    curso: string;
    tipo_documento: string;
    fecha_emision: string;
    horas_academicas?: number;
    ponente?: string;
    empresa: {
      nombre: string;
      logo: string | null;
    };
    archivo_url: string;
  };
}

export default function ValidarCertificadoPage() {
  const searchParams = useSearchParams();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🆕 Validación automática al cargar desde QR
  useEffect(() => {
    const codigoFromUrl = searchParams.get('codigo');
    if (codigoFromUrl) {
      setCodigo(codigoFromUrl);
      validarCertificado(codigoFromUrl);
    }
  }, [searchParams]);

  const validarCertificado = async (codigoParam?: string) => {
    const codigoAValidar = codigoParam || codigo;

    if (!codigoAValidar.trim()) {
      setError('Ingresa un código de certificado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultado(null);

      const response = await fetch(`/api/validar?codigo=${encodeURIComponent(codigoAValidar.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setResultado(data);
      } else {
        setError(data.mensaje || data.error || 'Error al validar certificado');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const verCertificado = () => {
    if (!resultado?.certificado) return;
    window.open(resultado.certificado.archivo_url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header con colores VAXA */}
      <div className="border-b border-emerald-100 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Validación de Certificados</h1>
              <p className="text-xs text-emerald-700 font-medium">Sistema VAXA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Buscador */}
        {!resultado && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 mb-4 shadow-xl">
                <Search className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Verifica tu Certificado
              </h2>
              <p className="text-gray-600">
                Ingresa el código o escanea el QR del certificado
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && validarCertificado()}
                placeholder="VAXA-XXX-XXXXXXXXXX-XXXXXX"
                className="w-full px-6 py-5 bg-white border-2 border-emerald-200 rounded-2xl text-center font-mono text-lg focus:outline-none focus:border-emerald-600 transition-all placeholder:text-gray-400"
                disabled={loading}
              />
              <button
                onClick={() => validarCertificado()}
                disabled={loading || !codigo.trim()}
                className="absolute right-2 top-2 bottom-2 px-8 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Validar'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">No encontrado</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultado - Certificado NO válido */}
        {resultado && !resultado.valido && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-100 mb-6">
                <ShieldAlert className="w-10 h-10 text-amber-600" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-3">
                Certificado Revocado
              </h3>
              <p className="text-amber-700 mb-6">{resultado.mensaje}</p>
              {resultado.certificado && (
                <div className="inline-block bg-white rounded-xl px-6 py-3 border-2 border-amber-200">
                  <p className="text-xs text-amber-600 mb-1">Código verificado</p>
                  <p className="font-mono font-semibold text-gray-900 text-sm">{resultado.certificado.codigo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resultado - Certificado VÁLIDO - COLORES VAXA */}
        {resultado && resultado.valido && resultado.certificado && (
          <div className="space-y-1">

            {/* Status Badge con colores VAXA */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-full shadow-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-emerald-900">Certificado Válido</span>
              </div>
            </div>

            {/* Nombre - Card Principal con colores VAXA */}
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 mb-6 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Award className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                    Otorgado a
                  </p>
                  <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    {resultado.certificado.nombre_certificado}
                  </h2>
                </div>
              </div>

              {/* Curso */}
              <div className="border-t-2 border-emerald-50 pt-6">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                  Programa
                </p>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {resultado.certificado.curso}
                </p>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                  {resultado.certificado.tipo_documento}
                </span>
              </div>
            </div>

            {/* Grid de Detalles con colores VAXA */}
            <div className="grid grid-cols-2 gap-4 mb-6">

              {/* Fecha */}
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Emisión</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatearFecha(resultado.certificado.fecha_emision)}
                </p>
              </div>

              {/* Vigencia con colores VAXA */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Vigencia</span>
                </div>
                <p className="text-lg font-semibold text-emerald-900">
                  Permanente
                </p>
              </div>

              {/* Horas */}
              {resultado.certificado.horas_academicas && (
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Duración</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {resultado.certificado.horas_academicas}h
                  </p>
                </div>
              )}

              {/* Empresa */}
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Emisor</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 leading-tight">
                  {resultado.certificado.empresa.nombre}
                </p>
              </div>

              {/* Ponente */}
              {resultado.certificado.ponente && (
                <div className="col-span-2 bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Instructor</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {resultado.certificado.ponente}
                  </p>
                </div>
              )}
            </div>

            {/* Código de verificación */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 mb-6">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Código de Verificación
              </p>
              <p className="font-mono text-sm font-medium text-gray-700 break-all">
                {resultado.certificado.codigo}
              </p>
            </div>

            {/* Botones de Acción con colores VAXA */}
            <div className="flex gap-3">
              <button
                onClick={verCertificado}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <ExternalLink className="w-5 h-5" strokeWidth={2} />
                Ver Certificado
              </button>
              <a
                href={resultado.certificado.archivo_url}
                download
                className="flex-1 px-6 py-4 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" strokeWidth={2} />
                Descargar
              </a>
            </div>

            {/* Validar otro */}
            <button
              onClick={() => {
                setResultado(null);
                setCodigo('');
                setError(null);
              }}
              className="w-full mt-6 px-6 py-3 text-emerald-700 hover:text-emerald-900 font-medium transition-all"
            >
              ← Validar otro certificado
            </button>
          </div>
        )}

        {/* Info QR */}
        {!resultado && !error && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
              <p className="text-sm text-emerald-700 font-medium">
                Escanea el código QR del certificado para validar automáticamente
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer con colores VAXA */}
      <div className="border-t-2 border-emerald-100 py-8 mt-16 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-center text-sm text-emerald-800 font-medium">
            Sistema de Validación VAXA · Certificados Verificables
          </p>
          <p className="text-center text-xs text-emerald-600 mt-1">
            Historias Clínicas · Software Médico · Certificaciones
          </p>
        </div>
      </div>
    </div>
  );
}
