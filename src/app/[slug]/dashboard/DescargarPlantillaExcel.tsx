'use client';

import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import ExcelJS from 'exceljs';

export default function DescargarPlantillaExcel() {

  const descargarPlantilla = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema VAXA';
    workbook.created = new Date();

    // ============================================
    // HOJA 1: INSTRUCCIONES - PROFESIONAL CON COLORES
    // ============================================
    const sheetInstrucciones = workbook.addWorksheet('📋 Instrucciones', {
      properties: { tabColor: { argb: 'FF1E40AF' } }
    });

    // Título principal
    sheetInstrucciones.mergeCells('A1:D1');
    const tituloCell = sheetInstrucciones.getCell('A1');
    tituloCell.value = '🎓 PLANTILLA DE CERTIFICADOS - SISTEMA VAXA 🎓';
    tituloCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    tituloCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetInstrucciones.getRow(1).height = 30;

    // Espaciado
    sheetInstrucciones.getRow(2).height = 10;

    // Subtítulo - Instrucciones
    sheetInstrucciones.mergeCells('A3:D3');
    const subtitulo1 = sheetInstrucciones.getCell('A3');
    subtitulo1.value = '📋 INSTRUCCIONES DE USO';
    subtitulo1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    subtitulo1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };
    subtitulo1.alignment = { horizontal: 'left', vertical: 'middle' };
    sheetInstrucciones.getRow(3).height = 25;

    // Instrucciones
    const instrucciones = [
      ['Paso 1️⃣', 'Complete la hoja "Datos Participantes" con la información de cada estudiante'],
      ['Paso 2️⃣', 'NO modifique los nombres de las columnas (encabezados en azul)'],
      ['Paso 3️⃣', 'Todos los participantes del lote compartirán el mismo:'],
      ['', '✓ Tipo de Documento (configurado en el Paso 1)'],
      ['', '✓ Curso (configurado en el Paso 1)']
    ];

    let row = 5;
    instrucciones.forEach((inst) => {
      sheetInstrucciones.getCell(`A${row}`).value = inst[0];
      sheetInstrucciones.getCell(`B${row}`).value = inst[1];
      sheetInstrucciones.getRow(row).height = 20;
      row++;
    });

    row += 2;

    // Subtítulo - Guía de Campos
    sheetInstrucciones.mergeCells(`A${row}:D${row}`);
    const subtitulo2 = sheetInstrucciones.getCell(`A${row}`);
    subtitulo2.value = '📝 GUÍA DE CAMPOS';
    subtitulo2.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    subtitulo2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };
    subtitulo2.alignment = { horizontal: 'left', vertical: 'middle' };
    sheetInstrucciones.getRow(row).height = 25;

    row += 2;

    // Encabezados de tabla
    const headerRow = row;
    const headers = ['Campo', 'Formato', 'Ejemplo', '¿Obligatorio?'];
    headers.forEach((header, idx) => {
      const cell = sheetInstrucciones.getCell(String.fromCharCode(65 + idx) + row);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    sheetInstrucciones.getRow(row).height = 20;

    row++;

    // Datos de campos
    const campos = [
      ['Término', 'Texto corto', 'Lic. / Dr. / Dra. / Ing.', '⭕ Opcional'],
      ['Nombres', 'Texto completo', 'Juan Carlos', '✅ SÍ'],
      ['Apellidos', 'Texto completo', 'Pérez García', '✅ SÍ'],
      ['DNI', '8 dígitos', '12345678', '✅ SÍ'],
      ['Correo Electrónico', 'formato email', 'juan.perez@ejemplo.com', '⭕ Opcional'],
      ['Fecha de Emisión', 'DD/MM/AAAA', '15/03/2024', '✅ SÍ'],
      ['Horas Académicas', 'Número entero', '40', '✅ SÍ'],
      ['Fecha de Inicio', 'DD/MM/AAAA', '01/03/2024', '✅ SÍ'],
      ['Fecha de Fin', 'DD/MM/AAAA', '15/03/2024', '✅ SÍ']
    ];

    campos.forEach((campo, idx) => {
      const isEven = idx % 2 === 0;
      campo.forEach((val, colIdx) => {
        const cell = sheetInstrucciones.getCell(String.fromCharCode(65 + colIdx) + row);
        cell.value = val;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFEFF6FF' : 'FFDBEAFE' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
      sheetInstrucciones.getRow(row).height = 18;
      row++;
    });

    row += 2;

    // Advertencias
    sheetInstrucciones.mergeCells(`A${row}:D${row}`);
    const advertencia = sheetInstrucciones.getCell(`A${row}`);
    advertencia.value = '⚠️ IMPORTANTE - EVITE ERRORES';
    advertencia.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
    advertencia.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' }
    };
    advertencia.alignment = { horizontal: 'left', vertical: 'middle' };
    sheetInstrucciones.getRow(row).height = 22;

    row++;

    const warnings = [
      '✓ Puede agregar tantas filas como participantes necesite',
      '✓ NO deje filas vacías entre participantes',
      '✓ Elimine espacios extra al inicio y final de los textos',
      '✓ Guarde el archivo como .xlsx (formato Excel)',
      '✓ Verifique que las fechas estén en formato DD/MM/AAAA'
    ];

    warnings.forEach((warn) => {
      sheetInstrucciones.mergeCells(`A${row}:D${row}`);
      const cell = sheetInstrucciones.getCell(`A${row}`);
      cell.value = warn;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheetInstrucciones.getRow(row).height = 18;
      row++;
    });

    // Ajustar anchos de columna
    sheetInstrucciones.getColumn(1).width = 28;
    sheetInstrucciones.getColumn(2).width = 55;
    sheetInstrucciones.getColumn(3).width = 35;
    sheetInstrucciones.getColumn(4).width = 18;

    // ============================================
    // HOJA 2: DATOS PARTICIPANTES - CON COLORES
    // ============================================
    const sheetDatos = workbook.addWorksheet('👥 Datos Participantes', {
      properties: { tabColor: { argb: 'FF10B981' } }
    });

    // Encabezados con colores
    const columnas = [
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

    columnas.forEach((col, idx) => {
      const cell = sheetDatos.getCell(1, idx + 1);
      cell.value = col;
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    });
    sheetDatos.getRow(1).height = 30;

    // Ejemplos de datos CON FECHAS REALES DE EXCEL
    const ejemplos = [
      ['Lic.', 'Juan Carlos', 'Pérez García', '12345678', 'juan.perez@ejemplo.com', new Date(2024, 2, 15), 40, new Date(2024, 2, 1), new Date(2024, 2, 15)],
      ['Dra.', 'María Isabel', 'López Sánchez', '87654321', 'maria.lopez@ejemplo.com', new Date(2024, 2, 15), 40, new Date(2024, 2, 1), new Date(2024, 2, 15)],
      ['Ing.', 'Carlos Alberto', 'Ramírez Torres', '45678901', 'carlos.ramirez@ejemplo.com', new Date(2024, 2, 15), 40, new Date(2024, 2, 1), new Date(2024, 2, 15)]
    ];

    ejemplos.forEach((ejemplo, rowIdx) => {
      const isEven = rowIdx % 2 === 0;
      ejemplo.forEach((val, colIdx) => {
        const cell = sheetDatos.getCell(rowIdx + 2, colIdx + 1);
        cell.value = val;

        // Si es una columna de fecha (columnas 6, 8, 9 = índices 5, 7, 8)
        if (colIdx === 5 || colIdx === 7 || colIdx === 8) {
          cell.numFmt = 'dd/mm/yyyy'; // Formato de fecha
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF0F9FF' : 'FFDBEAFE' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
      sheetDatos.getRow(rowIdx + 2).height = 20;
    });

    // AGREGAR 50 FILAS VACÍAS CON FORMATO Y VALIDACIÓN
    for (let i = 0; i < 50; i++) {
      const rowIdx = ejemplos.length + i;
      const isEven = rowIdx % 2 === 0;

      for (let colIdx = 0; colIdx < columnas.length; colIdx++) {
        const cell = sheetDatos.getCell(rowIdx + 2, colIdx + 1);

        // Si es una columna de fecha (columnas 6, 8, 9 = índices 5, 7, 8)
        if (colIdx === 5 || colIdx === 7 || colIdx === 8) {
          cell.numFmt = 'dd/mm/yyyy'; // Formato de fecha DD/MM/AAAA

          // Agregar validación de datos para asegurar formato de fecha
          cell.dataValidation = {
            type: 'date',
            operator: 'greaterThan',
            showErrorMessage: true,
            allowBlank: true,
            formulae: [new Date(2000, 0, 1)],
            errorStyle: 'warning',
            errorTitle: 'Fecha incorrecta',
            error: 'Por favor ingrese una fecha válida en formato DD/MM/AAAA'
          };
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF0F9FF' : 'FFDBEAFE' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      sheetDatos.getRow(rowIdx + 2).height = 20;
    }

    // Anchos de columna
    sheetDatos.getColumn(1).width = 12;  // Término
    sheetDatos.getColumn(2).width = 22;  // Nombres
    sheetDatos.getColumn(3).width = 24;  // Apellidos
    sheetDatos.getColumn(4).width = 14;  // DNI
    sheetDatos.getColumn(5).width = 35;  // Correo
    sheetDatos.getColumn(6).width = 18;  // Fecha Emisión
    sheetDatos.getColumn(7).width = 18;  // Horas
    sheetDatos.getColumn(8).width = 18;  // Fecha Inicio
    sheetDatos.getColumn(9).width = 18;  // Fecha Fin

    // ============================================
    // HOJA 3: TÉRMINOS PROFESIONALES - MORADO
    // ============================================
    const sheetTerminos = workbook.addWorksheet('🎓 Términos', {
      properties: { tabColor: { argb: 'FF7C3AED' } }
    });

    // Título
    sheetTerminos.mergeCells('A1:B1');
    const tituloTerminos = sheetTerminos.getCell('A1');
    tituloTerminos.value = '🎓 TÉRMINOS PROFESIONALES DISPONIBLES';
    tituloTerminos.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    tituloTerminos.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C3AED' }
    };
    tituloTerminos.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetTerminos.getRow(1).height = 28;

    // Descripción
    sheetTerminos.mergeCells('A3:B3');
    const desc = sheetTerminos.getCell('A3');
    desc.value = 'Use cualquiera de estos términos o deje la columna "Término" en blanco si no aplica';
    desc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    sheetTerminos.getRow(3).height = 25;

    // Encabezados
    const termHeaderRow = 5;
    ['Término', 'Significado / Uso'].forEach((header, idx) => {
      const cell = sheetTerminos.getCell(termHeaderRow, idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8B5CF6' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    sheetTerminos.getRow(termHeaderRow).height = 22;

    // Términos
    const terminos = [
      ['Sr.', 'Señor - Tratamiento formal masculino'],
      ['Sra.', 'Señora - Tratamiento formal femenino'],
      ['Srta.', 'Señorita - Tratamiento formal para mujeres jóvenes'],
      ['Dr.', 'Doctor - Título de doctorado (hombres)'],
      ['Dra.', 'Doctora - Título de doctorado (mujeres)'],
      ['Lic.', 'Licenciado/a - Título universitario'],
      ['Ing.', 'Ingeniero/a - Título de ingeniería'],
      ['Arq.', 'Arquitecto/a - Título de arquitectura'],
      ['Mgr.', 'Magíster - Título de maestría'],
      ['MBA', 'Master in Business Administration'],
      ['PhD', 'Doctor en Filosofía - Doctorado investigación'],
      ['Bachiller', 'Bachiller - Grado académico'],
      ['Técnico', 'Técnico/a - Nivel técnico superior'],
      ['Prof.', 'Profesor/a - Docente']
    ];

    let termRow = termHeaderRow + 1;
    terminos.forEach((termino, idx) => {
      const isEven = idx % 2 === 0;
      termino.forEach((val, colIdx) => {
        const cell = sheetTerminos.getCell(termRow, colIdx + 1);
        cell.value = val;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF5F3FF' : 'FFEDE9FE' }
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
      sheetTerminos.getRow(termRow).height = 18;
      termRow++;
    });

    // Nota importante
    termRow += 2;
    sheetTerminos.mergeCells(`A${termRow}:B${termRow}`);
    const nota = sheetTerminos.getCell(`A${termRow}`);
    nota.value = '💡 NOTA IMPORTANTE:';
    nota.font = { bold: true };
    nota.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' }
    };
    sheetTerminos.getRow(termRow).height = 20;

    termRow++;
    sheetTerminos.mergeCells(`A${termRow}:B${termRow}`);
    const nota2 = sheetTerminos.getCell(`A${termRow}`);
    nota2.value = 'El término aparecerá ANTES del nombre completo en el certificado';
    nota2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' }
    };
    sheetTerminos.getRow(termRow).height = 18;

    termRow += 2;
    sheetTerminos.mergeCells(`A${termRow}:B${termRow}`);
    const ejemplo = sheetTerminos.getCell(`A${termRow}`);
    ejemplo.value = 'Ejemplo: "Dr. Juan Carlos Pérez García"';
    ejemplo.font = { bold: true };
    ejemplo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD1FAE5' }
    };
    sheetTerminos.getRow(termRow).height = 20;

    // Anchos
    sheetTerminos.getColumn(1).width = 18;
    sheetTerminos.getColumn(2).width = 55;

    // ============================================
    // GENERAR Y DESCARGAR
    // ============================================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PLANTILLA_CERTIFICADOS_VAXA.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Botón de descarga - Minimalista */}
      <div className="text-center">
        <button
          onClick={descargarPlantilla}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white rounded-lg hover:opacity-90 transition-all font-medium"
        >
          <Download className="w-5 h-5" />
          Descargar Plantilla Excel
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Plantilla con validaciones y formato profesional
        </p>
      </div>

      {/* Información compacta */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Campos incluidos:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
          <span>• Término</span>
          <span>• Nombres</span>
          <span>• Apellidos</span>
          <span>• DNI</span>
          <span>• Correo</span>
          <span>• Fecha Emisión</span>
          <span>• Horas</span>
          <span>• Fecha Inicio</span>
          <span>• Fecha Fin</span>
        </div>
      </div>
    </div>
  );
}
