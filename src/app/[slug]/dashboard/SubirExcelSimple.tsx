'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  empresaId: number;
  onExcelCargado: (datos: any[]) => void;
  onValidacionChange?: (esValido: boolean) => void;
}

const CAMPOS_REQUERIDOS = [
  'Término',
  'Nombres',
  'Apellidos',
  'DNI',
  'Correo Electrónico',
  'Fecha de Emisión',
  'Horas Académicas',
  'Fecha de Inicio',
  'Fecha de Fin'
];

export default function SubirExcelSimple({ empresaId, onExcelCargado, onValidacionChange }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [datosExcel, setDatosExcel] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleArchivoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpiar estados previos ANTES de comenzar validación
    setArchivo(file);
    setError(null);
    setExito(false);
    setDatosExcel([]);

    try {
      setCargando(true);

      // Leer el Excel
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Buscar la hoja "Datos Participantes" (con o sin emoji)
      let sheetName = workbook.SheetNames.find(name =>
        name.includes('Datos Participantes') || name.includes('Datos')
      );

      // Si no se encuentra, intentar con la segunda hoja (índice 1)
      if (!sheetName && workbook.SheetNames.length > 1) {
        sheetName = workbook.SheetNames[1];
      }

      // Si aún no hay, usar la primera
      if (!sheetName) {
        sheetName = workbook.SheetNames[0];
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setError('El archivo Excel está vacío');
        setCargando(false);
        return;
      }

      // Validar que tenga todos los campos requeridos
      const primeraFila = data[0] as any;
      const columnasExcel = Object.keys(primeraFila);

      const camposFaltantes = CAMPOS_REQUERIDOS.filter(campo => !columnasExcel.includes(campo));

      if (camposFaltantes.length > 0) {
        setError(`Faltan las siguientes columnas en el Excel: ${camposFaltantes.join(', ')}`);
        setCargando(false);
        if (onValidacionChange) onValidacionChange(false);
        return;
      }

      // Todo OK (ya no necesitamos validar Tipo de Documento, Curso, Ponente)
      setDatosExcel(data);
      setExito(true);
      onExcelCargado(data);
      if (onValidacionChange) onValidacionChange(true);

    } catch (err) {
      setError('Error al leer el archivo Excel. Verifica el formato.');
      console.error(err);
      if (onValidacionChange) onValidacionChange(false);
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setArchivo(null);
    setDatosExcel([]);
    setError(null);
    setExito(false);
    if (onValidacionChange) onValidacionChange(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-10 h-10 text-orange-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Sube el Excel con los Datos
        </h3>
        <p className="text-gray-600">
          Usa la plantilla descargada en el Paso 1
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {exito && datosExcel.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-bold text-green-800 text-lg">¡Excel cargado correctamente!</h4>
              <p className="text-sm text-green-700">Se generarán {datosExcel.length} certificados</p>
            </div>
          </div>


          {/* Vista previa de datos */}
          <div className="bg-white rounded-lg p-4">
            <h5 className="font-semibold text-gray-800 mb-3">👥 Primeros 5 registros:</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Término</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Nombres</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Apellidos</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">DNI</th>
                  </tr>
                </thead>
                <tbody>
                  {datosExcel.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-600">{row['Término']}</td>
                      <td className="py-2 px-3 text-gray-800">{row['Nombres']}</td>
                      <td className="py-2 px-3 text-gray-800">{row['Apellidos']}</td>
                      <td className="py-2 px-3 text-gray-600">{row['DNI']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {datosExcel.length > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ... y {datosExcel.length - 5} registros más
                </p>
              )}
            </div>
          </div>

          <button
            onClick={reiniciar}
            className="mt-4 text-sm text-orange-600 hover:text-orange-700 underline"
          >
            Cambiar archivo
          </button>
        </div>
      )}

      {/* Botón para subir archivo */}
      {!exito && (
        <div>
          <label className="block">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArchivoChange}
              className="hidden"
              disabled={cargando}
            />
            <div className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${cargando
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-orange-300 bg-orange-50 hover:bg-orange-100 hover:border-orange-400'
              }
            `}>
              {cargando ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                  <p className="text-sm font-medium text-gray-700">Validando archivo...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Haz clic para seleccionar el Excel
                  </p>
                  <p className="text-xs text-gray-500">
                    Archivo .xlsx o .xls con la plantilla descargada
                  </p>
                </>
              )}
            </div>
          </label>

          {/* Recordatorio */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              ℹ️ Recordatorio:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Usa la plantilla descargada en el Paso 1</li>
              <li>• No modifiques los nombres de las columnas</li>
              <li>• Completa todos los campos obligatorios</li>
              <li>• El Tipo de Documento y Curso ya fueron configurados en el Paso 1</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
