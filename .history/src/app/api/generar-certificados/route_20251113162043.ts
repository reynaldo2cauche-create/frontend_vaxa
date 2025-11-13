import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Lote } from '@/lib/entities/Lote';
import { CertificadoService, DatosCertificado } from '@/lib/services/CertificadoService';
import * as XLSX from 'xlsx';

/**
 * Convierte un número de fecha de Excel a formato DD/MM/AAAA
 * Excel almacena fechas como números (días desde 1900-01-01)
 */
function convertirFechaExcel(valor: any): string {
  if (!valor) return '';

  // Si ya es una cadena de texto con formato de fecha, devolverla
  if (typeof valor === 'string' && valor.includes('/')) {
    return valor;
  }

  // Si es un número (formato interno de Excel)
  if (typeof valor === 'number') {
    // Excel cuenta días desde 1900-01-01 (con un bug que cuenta 1900 como bisiesto)
    const fechaExcel = XLSX.SSF.parse_date_code(valor);
    if (fechaExcel) {
      const dia = String(fechaExcel.d).padStart(2, '0');
      const mes = String(fechaExcel.m).padStart(2, '0');
      const anio = fechaExcel.y;
      return `${dia}/${mes}/${anio}`;
    }
  }

  // Si es un objeto Date
  if (valor instanceof Date) {
    const dia = String(valor.getDate()).padStart(2, '0');
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const anio = valor.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  return String(valor);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener datos del formulario
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const empresaId = parseInt(formData.get('empresaId') as string);
    const mapeoJson = formData.get('mapeo') as string;
    const textoEstatico = formData.get('textoEstatico') as string | null;
    const tipoDocumento = formData.get('tipoDocumento') as string | null;
    const curso = formData.get('curso') as string | null;
    const firmasIdsJson = formData.get('firmasIds') as string | null;

    // Validaciones basicas
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se recibio ningun archivo' },
        { status: 400 }
      );
    }

    if (!empresaId || isNaN(empresaId)) {
      return NextResponse.json(
        { success: false, error: 'ID de empresa invalido' },
        { status: 400 }
      );
    }

    if (!mapeoJson) {
      return NextResponse.json(
        { success: false, error: 'No se recibio el mapeo de columnas' },
        { status: 400 }
      );
    }

    // 2. Parsear mapeo y firmas
    const mapeo: { [key: string]: string } = JSON.parse(mapeoJson);
    const mapeoMap = new Map(Object.entries(mapeo));
    const firmasIds = firmasIdsJson ? JSON.parse(firmasIdsJson) : undefined;

    console.log('Iniciando generacion de certificados...');
    console.log('   Empresa ID:', empresaId);
    console.log('   Archivo:', file.name);
    console.log('   Mapeo:', mapeo);
    console.log('   Tipo Documento:', tipoDocumento || 'No especificado');
    console.log('   Curso:', curso || 'No especificado');
    console.log('   Firmas IDs:', firmasIds || 'Sin firmas');

    // 3. Leer archivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const datosExcel = XLSX.utils.sheet_to_json(worksheet);

    if (datosExcel.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El archivo Excel esta vacio' },
        { status: 400 }
      );
    }

    console.log(`   ${datosExcel.length} filas encontradas en el Excel`);

    // 3.5. Procesar datos del Excel para concatenar nombre completo y convertir fechas
    const datosExcelProcesados = datosExcel.map((fila: any) => {
      const termino = fila[mapeo['termino']] || '';
      const nombres = fila[mapeo['nombre']] || '';
      const apellidos = fila[mapeo['apellido']] || '';

      // Concatenar nombre completo: Término + Nombres + Apellidos
      const nombreCompleto = `${termino} ${nombres} ${apellidos}`.trim();

      // Convertir todas las fechas de Excel a formato DD/MM/AAAA
      const filaProcesada: any = { ...fila };

      // Lista de campos que pueden contener fechas
      const camposFecha = ['Fecha de Emisión', 'Fecha de Inicio', 'Fecha de Fin', 'fecha_emision', 'fecha_inicio', 'fecha_fin'];

      // Convertir cada campo de fecha
      for (const campo of camposFecha) {
        if (filaProcesada[campo] !== undefined) {
          filaProcesada[campo] = convertirFechaExcel(filaProcesada[campo]);
        }
      }

      // Asegurar que "Horas Académicas" sea un número entero sin decimales
      if (filaProcesada['Horas Académicas'] !== undefined) {
        const horas = filaProcesada['Horas Académicas'];
        if (typeof horas === 'number') {
          filaProcesada['Horas Académicas'] = Math.round(horas);
        } else if (typeof horas === 'string') {
          filaProcesada['Horas Académicas'] = parseInt(horas) || 0;
        }
      }

      return {
        ...filaProcesada,
        'nombre_completo': nombreCompleto,  // Agregamos el nombre completo
        'curso': curso || filaProcesada['curso'],  // Curso del paso 1 tiene prioridad
        'Nombre del Curso': curso || filaProcesada['Nombre del Curso'] || '',
        'tipo_documento': tipoDocumento || filaProcesada['tipo_documento']  // Tipo documento del paso 1
      };
    });

    console.log(`   Datos procesados con nombres completos`);

    // 4. Inicializar base de datos
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('   Base de datos inicializada');
    }

    // 4.5. 🆕 VALIDAR LÍMITE DEL PLAN antes de procesar
    const { Empresa } = await import('@/lib/entities/Empresa');
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const empresa = await empresaRepo.findOne({ where: { id: empresaId } });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const certificadosDisponibles = empresa.limite_plan - empresa.certificados_emitidos;
    const certificadosAGenerar = datosExcel.length;

    console.log(`   📊 Plan actual: ${empresa.certificados_emitidos}/${empresa.limite_plan} certificados emitidos`);
    console.log(`   📊 Disponibles: ${certificadosDisponibles} | Solicitados: ${certificadosAGenerar}`);

    if (certificadosAGenerar > certificadosDisponibles) {
      console.log(`   ❌ LÍMITE EXCEDIDO: Se requieren ${certificadosAGenerar} pero solo quedan ${certificadosDisponibles}`);
      return NextResponse.json({
        success: false,
        error: 'Límite de plan excedido',
        mensaje: `Tu plan permite ${empresa.limite_plan} certificados en total. Ya has emitido ${empresa.certificados_emitidos}. Solo tienes ${certificadosDisponibles} certificados disponibles, pero intentas generar ${certificadosAGenerar}.`,
        disponibles: certificadosDisponibles,
        solicitados: certificadosAGenerar,
        emitidos: empresa.certificados_emitidos,
        limite: empresa.limite_plan
      }, { status: 403 });
    }

    console.log(`   ✅ Validación de plan aprobada`);

    // 5. Crear registro de lote
    const loteRepo = AppDataSource.getRepository(Lote);
    const nuevoLote = loteRepo.create({
      empresa_id: empresaId,
      nombre_archivo: file.name,
      cantidad_certificados: datosExcel.length,
      zip_url: null,
      tipo_documento: tipoDocumento,
      curso: curso,
      usuario_id: null,
      const nuevoLote = loteRepo.create({
  empresa_id: empresaId,
  nombre_archivo: file.name,
  cantidad_certificados: datosExcel.length,
  zip_url: null,
  tipo_documento: tipoDocumento,
  curso: curso,
  usuario_id: null,
  texto_estatico: textoEstatico  // 🆕 AGREGAR ESTA LÍNEA
});
    });

    await loteRepo.save(nuevoLote);
    console.log(`   Lote creado con ID: ${nuevoLote.id}`);

    // 6. Actualizar mapeo para incluir nombre_completo
    mapeoMap.set('nombre', 'nombre_completo');  // Ahora usamos el nombre completo concatenado

    // 6. Generar certificados
    console.log('   Generando certificados...');
    if (textoEstatico) {
      console.log(`   Usando texto estático personalizado: "${textoEstatico.substring(0, 50)}..."`);
    }

    const certificadosGenerados = await CertificadoService.generarLote(
      empresaId,
      datosExcelProcesados as DatosCertificado[],
      mapeoMap,
      nuevoLote.id,
      textoEstatico || undefined,  // Pasar el texto estático
      firmasIds  // Pasar IDs de firmas
    );

    console.log(`   ${certificadosGenerados.length} certificados generados`);

    // 6.5. 🆕 INCREMENTAR CONTADOR DE CERTIFICADOS EMITIDOS
    empresa.certificados_emitidos += certificadosGenerados.length;
    await empresaRepo.save(empresa);
    console.log(`   ✅ Contador actualizado: ${empresa.certificados_emitidos}/${empresa.limite_plan}`);

    // ✅ ZIP NO se crea ahora, se creará cuando presionen "Descargar ZIP"
    console.log('   ✅ Certificados guardados. Listo para descargar ZIP.');
    console.log('Proceso completado exitosamente');

    // 7. Retornar resultado (con loteId para que el botón pueda generar el ZIP)
    return NextResponse.json({
      success: true,
      data: {
        loteId: nuevoLote.id,
        totalGenerados: certificadosGenerados.length,
        // Esta URL se usará para generar el ZIP bajo demanda
        downloadZipUrl: `/api/lotes/${nuevoLote.id}/descargar-zip`,
        message: `Se generaron ${certificadosGenerados.length} certificados exitosamente`
      }
    });

  } catch (error) {
    console.error('Error al generar certificados:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar certificados'
      },
      { status: 500 }
    );
  }
}

// Config moved to route segment config
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for certificate generation
