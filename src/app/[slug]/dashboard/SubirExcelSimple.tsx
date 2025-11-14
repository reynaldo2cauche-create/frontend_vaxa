'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
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

    setArchivo(file);
    setError(null);
    setExito(false);
    setDatosExcel([]);

    try {
      setCargando(true);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      let sheetName = workbook.SheetNames.find(name =>
        name.includes('Datos Participantes') || name.includes('Datos')
      );

      if (!sheetName && workbook.SheetNames.length > 1) {
        sheetName = workbook.SheetNames[1];
      }

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

      const primeraFila = data[0] as any;
      const columnasExcel = Object.keys(primeraFila);

      const camposFaltantes = CAMPOS_REQUERIDOS.filter(campo => !columnasExcel.includes(campo));

      if (camposFaltantes.length > 0) {
        setError(`Faltan columnas: ${camposFaltantes.join(', ')}`);
        setCargando(false);
        if (onValidacionChange) onValidacionChange(false);
        return;
      }

      setDatosExcel(data);
      setExito(true);
      onExcelCargado(data);
      if (onValidacionChange) onValidacionChange(true);

    } catch (err) {
      setError('Error al leer el archivo. Verifica el formato.');
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
    <div className="space-y-4">
      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {exito && datosExcel.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900 text-sm">Excel cargado correctamente</p>
              <p className="text-xs text-green-700">{datosExcel.length} participantes encontrados</p>
            </div>
          </div>

          {/* Vista previa compacta */}
          <div className="bg-white rounded border border-green-200 p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Primeros registros:</p>
            <div className="space-y-1">
              {datosExcel.slice(0, 3).map((row, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <span>{row.Nombres} {row.Apellidos}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{row.DNI}</span>
                </div>
              ))}
              {datosExcel.length > 3 && (
                <p className="text-xs text-gray-500 mt-2">...y {datosExcel.length - 3} más</p>
              )}
            </div>
          </div>

          <button
            onClick={reiniciar}
            className="mt-3 text-xs text-green-700 hover:text-green-900 font-medium"
          >
            Cambiar archivo
          </button>
        </div>
      )}

      {/* Zona de subida */}
      {!exito && (
        <label className="block">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleArchivoChange}
            className="hidden"
            disabled={cargando}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
            {cargando ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Validando archivo...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Haz clic para seleccionar el archivo Excel
                </p>
                <p className="text-xs text-gray-500">Formato .xlsx o .xls</p>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}
