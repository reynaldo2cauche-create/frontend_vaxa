'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, ArrowRight, AlertCircle, FileSignature } from 'lucide-react';
import * as XLSX from 'xlsx';
import SeleccionarFirmas from './SeleccionarFirmas';

interface Props {
  empresaId: number;
  onCertificadosGenerados?: () => void;
}

interface ColumnaExcel {
  nombre: string;
  ejemplo: string;
}

interface Firma {
  id: number;
  nombre: string;
  cargo: string;
  firma_url: string;
}

// CAMPOS ACTUALIZADOS - Sin tipo_documento, curso, ponente
const CAMPOS_EXCEL = [
  { nombre: 'termino', label: 'Término', requerido: false },
  { nombre: 'nombres', label: 'Nombres', requerido: true },
  { nombre: 'apellidos', label: 'Apellidos', requerido: true },
  { nombre: 'dni', label: 'DNI', requerido: false },
  { nombre: 'correo', label: 'Correo Electrónico', requerido: false },
  { nombre: 'fecha_emision', label: 'Fecha de Emisión', requerido: true },
  { nombre: 'horas', label: 'Horas Académicas', requerido: false },
  { nombre: 'fecha_inicio', label: 'Fecha de Inicio', requerido: false },
  { nombre: 'fecha_fin', label: 'Fecha de Fin', requerido: false },
];

export default function SubirExcel({ empresaId, onCertificadosGenerados }: Props) {
  // Estados principales
  const [paso, setPaso] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Paso 1: Configuración inicial
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [curso, setCurso] = useState('');

  // Paso 2: Excel
  const [archivo, setArchivo] = useState<File | null>(null);
  const [columnasExcel, setColumnasExcel] = useState<ColumnaExcel[]>([]);
  const [datosExcel, setDatosExcel] = useState<any[]>([]);
  const [mapeo, setMapeo] = useState<{ [key: string]: string }>({});

  // Paso 3: Firmas
  const [firmasSeleccionadas, setFirmasSeleccionadas] = useState<Firma[]>([]);

  // Estado general
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // PASO 1: Avanzar a paso 2
  const handleContinuarPaso1 = () => {
    if (!tipoDocumento.trim()) {
      setError('Debes ingresar el tipo de documento');
      return;
    }
    if (!curso.trim()) {
      setError('Debes ingresar el nombre del curso');
      return;
    }
    setError(null);
    setPaso(2);
  };

  // PASO 2: Leer Excel
  const handleArchivoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivo(file);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setError('El archivo Excel está vacío');
        return;
      }

      const primeraFila = data[0] as any;
      const columnas: ColumnaExcel[] = Object.keys(primeraFila).map(key => ({
        nombre: key,
        ejemplo: String(primeraFila[key]).substring(0, 30)
      }));

      setColumnasExcel(columnas);
      setDatosExcel(data);

      // Auto-mapeo inteligente
      const SINONIMOS: { [key: string]: string[] } = {
        termino: ['termino', 'término', 'sr', 'sra', 'dr', 'dra'],
        nombres: ['nombre', 'nombres', 'name', 'first name'],
        apellidos: ['apellido', 'apellidos', 'surname', 'last name'],
        dni: ['dni', 'documento', 'cedula', 'id', 'numero documento'],
        correo: ['correo', 'email', 'e-mail', 'mail', 'correo electronico'],
        fecha_emision: ['fecha emision', 'fecha emisión', 'fecha', 'date'],
        horas: ['horas', 'horas academicas', 'horas académicas', 'hours'],
        fecha_inicio: ['fecha inicio', 'fecha de inicio', 'start date'],
        fecha_fin: ['fecha fin', 'fecha de fin', 'end date', 'fecha final']
      };

      const autoMapeo: { [key: string]: string } = {};
      for (const campo of CAMPOS_EXCEL) {
        const sinonimos = SINONIMOS[campo.nombre] || [campo.nombre];
        const columnaCoincidente = columnas.find(col => {
          const colNormalizada = col.nombre.toLowerCase().trim();
          return sinonimos.some(sinonimo =>
            colNormalizada.includes(sinonimo.toLowerCase()) ||
            sinonimo.toLowerCase().includes(colNormalizada)
          );
        });

        if (columnaCoincidente) {
          autoMapeo[campo.nombre] = columnaCoincidente.nombre;
        }
      }
      setMapeo(autoMapeo);
      setPaso(3);
    } catch (err) {
      setError('Error al leer el archivo Excel');
      console.error(err);
    }
  };

  // PASO 3: Continuar a selección de firmas
  const handleContinuarPaso3 = () => {
    const camposRequeridos = CAMPOS_EXCEL.filter(c => c.requerido);
    const camposFaltantes = camposRequeridos.filter(c => !mapeo[c.nombre]);

    if (camposFaltantes.length > 0) {
      setError(`Faltan mapear: ${camposFaltantes.map(c => c.label).join(', ')}`);
      return;
    }

    setError(null);
    setPaso(4);
  };

  // PASO 4: Continuar a resumen
  const handleContinuarPaso4 = () => {
    // Las firmas son opcionales, no requerimos validación
    setError(null);
    setPaso(5);
  };

  // PASO 5: Generar certificados
  const handleGenerar = async () => {
    setCargando(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', archivo!);
    formData.append('empresaId', empresaId.toString());
    formData.append('mapeo', JSON.stringify(mapeo));
    formData.append('tipoDocumento', tipoDocumento);
    formData.append('curso', curso);

    // Enviar solo los IDs de las firmas seleccionadas
    if (firmasSeleccionadas.length > 0) {
      const firmasIds = firmasSeleccionadas.map(f => f.id);
      formData.append('firmasIds', JSON.stringify(firmasIds));
    }

    try {
      const response = await fetch('/api/generar-certificados', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultado(data.data);

        if (data.data.downloadZipUrl) {
          const link = document.createElement('a');
          link.href = data.data.downloadZipUrl;
          link.click();
        }

        if (onCertificadosGenerados) {
          onCertificadosGenerados();
        }
      } else {
        setError(data.error || 'Error al generar certificados');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setPaso(1);
    setTipoDocumento('');
    setCurso('');
    setArchivo(null);
    setColumnasExcel([]);
    setDatosExcel([]);
    setMapeo({});
    setFirmasSeleccionadas([]);
    setResultado(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center">

        {/* PASO 1: CONFIGURACIÓN INICIAL */}
        {paso === 1 && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-10 h-10 text-blue-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Paso 1: Configuración del Lote
            </h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Configura el tipo de documento y curso para todos los certificados
            </p>

            <div className="w-full max-w-lg space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  placeholder="Ej: DNI, CE, RUC, Pasaporte"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Curso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ej: Curso de Excel Avanzado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleContinuarPaso1}
                className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Continuar →
              </button>
            </div>
          </>
        )}

        {/* PASO 2: SUBIR EXCEL */}
        {paso === 2 && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-purple-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Paso 2: Subir Excel
            </h3>
            <p className="text-gray-600 mb-6">
              Sube el archivo con los datos de los participantes
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-lg">
              <p className="font-semibold text-blue-900 mb-2">Columnas requeridas:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Nombres</strong> *</li>
                <li>• <strong>Apellidos</strong> *</li>
                <li>• <strong>Fecha de Emisión</strong> *</li>
                <li>• Término, DNI, Correo, Horas, Fechas (opcionales)</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                ❌ NO incluir: Tipo de Documento, Curso, Ponente
              </p>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleArchivoChange}
                className="hidden"
              />
              <div className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium shadow-lg transition-colors">
                <FileSpreadsheet className="w-6 h-6" />
                <span>Seleccionar Archivo Excel</span>
              </div>
            </label>

            <button
              onClick={() => setPaso(1)}
              className="mt-6 px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Volver
            </button>
          </>
        )}

        {/* PASO 3: MAPEAR COLUMNAS */}
        {paso === 3 && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Paso 3: Mapear Columnas
            </h3>
            <p className="text-gray-600 mb-6">
              Relaciona las columnas de tu Excel
            </p>

            <div className="w-full max-w-2xl space-y-3">
              {CAMPOS_EXCEL.map(campo => (
                <div key={campo.nombre} className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapeo[campo.nombre] || ''}
                    onChange={(e) => setMapeo({...mapeo, [campo.nombre]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {columnasExcel.map(col => (
                      <option key={col.nombre} value={col.nombre}>
                        {col.nombre} (Ej: {col.ejemplo})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-4">
              <button onClick={() => setPaso(2)} className="px-6 py-2 bg-gray-200 rounded-xl">
                ← Volver
              </button>
              <button onClick={handleContinuarPaso3} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-medium">
                Continuar →
              </button>
            </div>
          </>
        )}

        {/* PASO 4: SELECCIONAR FIRMAS */}
        {paso === 4 && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Paso 4: Seleccionar Firmas Digitales
            </h3>
            <p className="text-gray-600 mb-6">
              Selecciona hasta 3 firmas para los certificados
            </p>

            <div className="w-full max-w-3xl">
              <SeleccionarFirmas
                empresaId={empresaId}
                onFirmasSeleccionadas={setFirmasSeleccionadas}
                firmasPreSeleccionadas={firmasSeleccionadas}
              />
            </div>

            <div className="mt-6 flex gap-4">
              <button onClick={() => setPaso(3)} className="px-6 py-2 bg-gray-200 rounded-xl">
                ← Volver
              </button>
              <button
                onClick={handleContinuarPaso4}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium"
              >
                Continuar al Resumen →
              </button>
            </div>
          </>
        )}

        {/* PASO 5: RESUMEN Y GENERAR */}
        {paso === 5 && !resultado && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Paso 5: Resumen del Lote
            </h3>
            <p className="text-gray-600 mb-6">
              Verifica la información antes de generar
            </p>

            <div className="w-full max-w-2xl space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">Configuración del Lote</h4>
                <p className="text-sm text-blue-800">Tipo de Documento: <strong>{tipoDocumento}</strong></p>
                <p className="text-sm text-blue-800">Curso: <strong>{curso}</strong></p>
                <p className="text-sm text-blue-800">Total participantes: <strong>{datosExcel.length}</strong></p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-bold text-green-900 mb-2">Firmas Seleccionadas</h4>
                <ol className="space-y-1">
                  {firmasSeleccionadas.map((firma, idx) => (
                    <li key={firma.id} className="text-sm text-green-800">
                      {idx + 1}. {firma.nombre} - {firma.cargo}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setPaso(4)} className="px-6 py-2 bg-gray-200 rounded-xl">
                  ← Volver
                </button>
                <button
                  onClick={handleGenerar}
                  disabled={cargando}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      Generando {datosExcel.length} certificados...
                    </>
                  ) : (
                    <>🚀 Generar {datosExcel.length} Certificados</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* RESULTADO */}
        {resultado && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Certificados Generados!
            </h3>

            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl w-full max-w-md text-center">
              <p className="text-lg font-bold text-green-800 mb-4">
                {resultado.totalGenerados} certificados creados
              </p>

              {resultado.downloadZipUrl && (
                <a
                  href={resultado.downloadZipUrl}
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
                >
                  Descargar ZIP
                </a>
              )}
            </div>

            <button onClick={reiniciar} className="mt-6 px-6 py-2 text-gray-600 hover:text-gray-800">
              Generar más certificados
            </button>
          </>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl w-full max-w-md">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-red-800 mb-1">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
