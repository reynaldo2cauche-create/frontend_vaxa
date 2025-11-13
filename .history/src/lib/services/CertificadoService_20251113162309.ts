// src/lib/services/CertificadoService.ts

import { AppDataSource } from '../db';
import { In } from 'typeorm';
import { Certificado, EstadoCertificado } from '../entities/Certificado';
import { DatoCertificado } from '../entities/DatoCertificado';
import { Lote } from '../entities/Lote';
import { Participante, TipoDocumento } from '../entities/Participante';
import { Curso, TipoCertificado, ModalidadCurso } from '../entities/Curso';
import { FirmaDigital } from '../entities/FirmaDigital';
import { CertificadoFirma } from '../entities/CertificadoFirma';
import { PlantillaService } from './PlantillaService';
import { CanvasService } from './CanvasService';
import { QRService } from './QRService';
import { PDFService, FirmaPDF } from './PDFService';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Servicio para gestión de certificados con POSICIONES FIJAS
 * Todas las empresas usan las mismas coordenadas estándar
 */

export interface DatosCertificado {
  [campo: string]: string;
}

export interface CertificadoGenerado {
  codigo: string;
  nombreCompleto: string;
  rutaArchivo: string;
  datos: DatosCertificado;
}

export interface ResultadoValidacion {
  valido: boolean;
  certificado?: {
    codigo: string;
    empresa: string;
    logoEmpresa?: string;
    fechaEmision: Date;
    estado: EstadoCertificado;
    archivoUrl: string;
    datos: { [campo: string]: string };
  };
  mensaje?: string;
}

/**
 * DIMENSIONES ESTÁNDAR DE REFERENCIA
 * Todos los tamaños de fuente están optimizados para estas dimensiones
 * Se escalarán proporcionalmente para plantillas de otros tamaños
 */
const PLANTILLA_ESTANDAR = {
  ANCHO: 1920,
  ALTO: 1357
};

/**
 * CONFIGURACIÓN GLOBAL ESTÁNDAR CON POSICIONES RELATIVAS
 * Los tamaños de fuente son ABSOLUTOS para la plantilla estándar (1920x1357)
 * Se escalarán automáticamente para plantillas de otros tamaños
 */
const CONFIG_ESTANDAR = {
  // Logo de la empresa (esquina superior izquierda) - Posición 1
  LOGO: {
    x: 0.05,        // 5% desde la izquierda
    y: 0.06,        // 6% desde arriba
    width: 0.10,    // 10% del ancho
    height: 0.15    // 15% del alto
  },

  // Logo derecho (esquina superior derecha) - Posición 2
  LOGO_DERECHA: {
    x: 0.85,        // 85% desde la izquierda
    y: 0.06,        // 6% desde arriba
    width: 0.10,    // 10% del ancho
    height: 0.15    // 15% del alto
  },

  // Logo central (centro superior) - Posición 3
  LOGO_CENTRO: {
    x: 0.45,        // 45% desde la izquierda (centrado)
    y: 0.04,        // 4% desde arriba
    width: 0.10,    // 10% del ancho
    height: 0.12    // 12% del alto
  },

  // Título del certificado (parte superior centro)
  TITULO: {
    x: 0.50,        // centrado horizontalmente
    y: 0.30,        // 30% desde arriba
    baseSize: 42,   // px para plantilla estándar
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#1a365d',
    align: 'center' as CanvasTextAlign
  },

  // Nombre del participante (elemento principal, centrado)
  NOMBRE: {
    x: 0.50,        // centrado
    y: 0.42,        // 42% desde arriba
    baseSize: 64,   // px para plantilla estándar (destacado)
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: '#0f172a',
    align: 'center' as CanvasTextAlign
  },

  // Texto "Por haber completado"
  TEXTO_COMPLETADO: {
    x: 0.50,
    y: 0.54,        // 54% desde arriba
    baseSize: 26,   // px para plantilla estándar
    fontFamily: 'Arial',
    fontWeight: 'normal',
    color: '#475569',
    align: 'center' as CanvasTextAlign
  },

  // Nombre del curso/evento
  CURSO: {
    x: 0.50,
    y: 0.62,        // 62% desde arriba
    baseSize: 34,   // px para plantilla estándar
    fontFamily: 'Georgia',
    fontWeight: 'italic',
    color: '#1e40af',
    align: 'center' as CanvasTextAlign
  },

  // Fecha de emisión (izquierda)
  FECHA: {
    x: 0.40,        // 40% desde la izquierda
    y: 0.74,        // 74% desde arriba
    baseSize: 22,   // px para plantilla estándar
    fontFamily: 'Arial',
    fontWeight: 'normal',
    color: '#64748b',
    align: 'right' as CanvasTextAlign
  },

  // Horas/duración (derecha)
  HORAS: {
    x: 0.60,        // 60% desde la izquierda
    y: 0.74,        // misma altura que fecha
    baseSize: 22,   // px para plantilla estándar
    fontFamily: 'Arial',
    fontWeight: 'normal',
    color: '#64748b',
    align: 'left' as CanvasTextAlign
  },

  // Código QR (esquina inferior derecha)
  QR: {
    x: 0.86,        // 86% desde la izquierda
    y: 0.77,        // 77% desde arriba
    baseSize: 180   // px para plantilla estándar
  },

  // Código único del certificado (debajo del QR)
  CODIGO: {
    x: 0.91,        // centrado con el QR
    y: 0.93,        // 93% desde arriba
    baseSize: 14,   // px para plantilla estándar
    fontFamily: 'monospace',
    fontWeight: 'normal',
    color: '#94a3b8',
    align: 'center' as CanvasTextAlign
  }
};

/**
 * Helper: Buscar o crear participante
 */
async function buscarOCrearParticipante(
  empresaId: number,
  datos: DatosCertificado
): Promise<number | null> {
  try {
    const participanteRepo = AppDataSource.getRepository(Participante);

    // Campos necesarios
    const numeroDocumento = datos.DNI || datos.dni || datos.documento || null;
    const nombres = datos.nombres || datos.nombre || null;
    const apellidos = datos.apellidos || datos.apellido || null;

    console.log(`   🔍 Buscando participante - Documento: ${numeroDocumento}, Nombres: ${nombres}, Apellidos: ${apellidos}`);

    // Si no hay documento ni nombres, retornar null (certificado sin participante asociado)
    if (!numeroDocumento && !nombres) {
      console.log(`   ⚠️  No hay datos de participante, certificado sin asociación`);
      return null;
    }

    // Buscar por documento si existe
    let participante: Participante | null = null;

    if (numeroDocumento) {
      participante = await participanteRepo.findOne({
        where: {
          numero_documento: String(numeroDocumento),
          empresa_id: empresaId
        }
      });
    }

    // Si no existe, crear nuevo
    if (!participante && nombres) {
      // Determinar tipo de documento válido
      let tipoDoc = TipoDocumento.DNI;
      if (datos.tipo_documento) {
        const tipoStr = String(datos.tipo_documento).toUpperCase();
        if (tipoStr.includes('DNI')) tipoDoc = TipoDocumento.DNI;
        else if (tipoStr.includes('CE')) tipoDoc = TipoDocumento.CE;
        else if (tipoStr.includes('RUC')) tipoDoc = TipoDocumento.RUC;
        else if (tipoStr.includes('PASAPORTE')) tipoDoc = TipoDocumento.PASAPORTE;
        else tipoDoc = TipoDocumento.DNI; // Default
      }

      participante = participanteRepo.create({
        empresa_id: empresaId,
        tipo_documento: tipoDoc,
        numero_documento: String(numeroDocumento || ''),
        termino: datos.termino || null,
        nombres: String(nombres),
        apellidos: String(apellidos || ''),
        correo_electronico: datos.correo || datos.email || null,
        telefono: datos.telefono || datos.celular || null,
        ciudad: datos.ciudad || null
      });

      await participanteRepo.save(participante);
      console.log(`   ✅ Participante creado: ${participante.nombres} ${participante.apellidos} (ID: ${participante.id})`);
    } else if (participante) {
      console.log(`   ℹ️  Participante existente: ${participante.nombres} ${participante.apellidos} (ID: ${participante.id})`);
    }

    return participante?.id || null;
  } catch (error) {
    console.error('Error al buscar/crear participante:', error);
    return null;
  }
}

/**
 * Helper: Buscar o crear curso
 */
async function buscarOCrearCurso(
  empresaId: number,
  datos: DatosCertificado
): Promise<number | null> {
  try {
    const cursoRepo = AppDataSource.getRepository(Curso);

    const nombreCurso = datos.curso || datos.capacitacion || datos.programa || null;

    console.log(`   🔍 Buscando curso - Nombre: ${nombreCurso}`);

    if (!nombreCurso) {
      console.log(`   ⚠️  No hay nombre de curso, certificado sin asociación de curso`);
      return null;
    }

    // Buscar curso existente
    let curso = await cursoRepo.findOne({
      where: {
        nombre: String(nombreCurso),
        empresa_id: empresaId
      }
    });

    // Si no existe, crear nuevo
    if (!curso) {
      curso = cursoRepo.create({
        empresa_id: empresaId,
        nombre: String(nombreCurso),
        tipo_documento: TipoCertificado.CERTIFICADO,
        horas_academicas: datos.horas ? parseFloat(String(datos.horas)) : null,
        modalidad: datos.modalidad as ModalidadCurso || null,
        ponente: datos.ponente || datos.instructor || null,
        fecha_inicio: datos.fecha_inicio ? new Date(String(datos.fecha_inicio)) : null,
        fecha_fin: datos.fecha_fin || datos.fecha ? new Date(String(datos.fecha_fin || datos.fecha)) : null,
        activo: true
      });

      await cursoRepo.save(curso);
      console.log(`   ✅ Curso creado: ${curso.nombre} (ID: ${curso.id})`);
    } else {
      console.log(`   ℹ️  Curso existente: ${curso.nombre} (ID: ${curso.id})`);
    }

    return curso.id;
  } catch (error) {
    console.error('Error al buscar/crear curso:', error);
    return null;
  }
}

export class CertificadoService {
  /**
   * Genera un código único para certificado
   * Formato: VAXA-{empresaId}-{timestamp}-{random}
   */
  static generarCodigo(empresaId: number): string {
    const timestamp = Date.now();
    const random = nanoid(6).toUpperCase();
    return `VAXA-${empresaId}-${timestamp}-${random}`;
  }

  /**
   * Genera un certificado individual con POSICIONES FIJAS
   */
// Reemplaza SOLO la función generarCertificado en tu CertificadoService.ts

static async generarCertificado(
  empresaId: number,
  datos: DatosCertificado,
  loteId?: number,
  textoEstatico?: string,
  firmasIds?: number[]
): Promise<CertificadoGenerado> {
  try {
    // 1. Obtener plantilla (fondo y logo)
    const plantilla = await PlantillaService.obtenerPlantillaBasica(empresaId);

    if (!plantilla || !plantilla.fondo) {
      throw new Error('La empresa no tiene plantilla configurada');
    }

    console.log(`✅ Plantilla obtenida para empresa ${empresaId}:`);
    console.log(`   - Fondo: ${plantilla.fondo}`);
    console.log(`   - Logo antiguo: ${plantilla.logo || 'No configurado'}`);
    console.log(`   - Logos múltiples: ${plantilla.logos.length} logo(s)`);

    // 1b. Obtener firmas si se proporcionaron IDs
    let firmasParaCertificado: FirmaPDF[] = [];
    if (firmasIds && firmasIds.length > 0) {
      const firmaRepo = AppDataSource.getRepository(FirmaDigital);
      const firmas = await firmaRepo.find({
        where: {
          id: In(firmasIds)
        }
      });

      firmasParaCertificado = firmas.map(f => ({
        nombre: f.nombre,
        cargo: f.cargo,
        firmaUrl: f.firmaUrl
      }));

      console.log(`✅ Firmas obtenidas: ${firmasParaCertificado.length} firma(s)`);
    }

    // 2. Obtener textos configurados
    let titulo = 'CERTIFICADO DE PARTICIPACIÓN';
    let textoCompletado = 'Por haber completado exitosamente';

    // Si hay texto estático del paso 4, usarlo (tiene prioridad)
    if (textoEstatico && textoEstatico.trim()) {
      textoCompletado = textoEstatico;
      console.log('✅ Usando texto estático personalizado del paso 4');
    } else {
      // Si no, buscar en la base de datos
      const textoConfig = await PlantillaService.obtenerTextoConfig(empresaId);
      if (textoConfig) {
        if (textoConfig.tipo === 'plantilla' && textoConfig.plantillaTexto) {
          titulo = textoConfig.plantillaTexto.titulo;
          textoCompletado = textoConfig.plantillaTexto.cuerpo;
        }
      }
    }

    // 3. Generar código único
    const codigo = this.generarCodigo(empresaId);

    // 4. Generar QR
    const qrDataURL = await QRService.generarQRParaCertificado(
      codigo, 
      CONFIG_ESTANDAR.QR.baseSize
    );

    // 5. Preparar ruta de salida
    const outputDir = path.join(
      process.cwd(),
      'public',
      'generated',
      empresaId.toString(),
      loteId ? `lote-${loteId}` : 'individual'
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${codigo}.pdf`;
    const outputPath = path.join(outputDir, filename);

    // 6. Preparar datos para PDF
    const datosPDF = {
      titulo: titulo,
      nombre: datos.nombre || 'Sin nombre',
      curso: datos.curso || 'Sin curso',
      fecha: datos.fecha || new Date().toLocaleDateString('es-PE'),
      horas: datos.horas || '',
      cuerpo: textoCompletado
    };

    // 7. Generar PDF del certificado
    await PDFService.generarCertificadoPDF({
      plantillaFondo: plantilla.fondo,
      logoEmpresa: plantilla.logo || undefined, // Logo antiguo (compatibilidad)
      logos: plantilla.logos.map(logo => ({ // Logos múltiples (nuevo sistema)
        url: logo.url,
        posicion: logo.posicion
      })),
      firmas: firmasParaCertificado, // Firmas digitales
      datos: datosPDF,
      codigo,
      qrDataURL,
      outputPath
    });

    console.log(`Certificado PDF generado: ${codigo}`);

    // 8. Construir URL relativa
    const rutaRelativa = `/generated/${empresaId}/${loteId ? `lote-${loteId}` : 'individual'}/${filename}`;

    return {
      codigo,
      nombreCompleto: datos.nombre || 'Sin nombre',
      rutaArchivo: rutaRelativa,
      datos
    };
  } catch (error) {
    console.error('Error al generar certificado:', error);
    throw new Error(`Error al generar certificado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

  /**
   * Genera un lote completo de certificados
   */
  static async generarLote(
    empresaId: number,
    datosExcel: DatosCertificado[],
    mapeo: Map<string, string>,
    loteId: number,
    textoEstatico?: string,
    firmasIds?: number[]
  ): Promise<CertificadoGenerado[]> {
    try {
      const certificadosGenerados: CertificadoGenerado[] = [];
      const certificadoRepo = AppDataSource.getRepository(Certificado);
      const datoCertificadoRepo = AppDataSource.getRepository(DatoCertificado);
      const certificadoFirmaRepo = AppDataSource.getRepository(CertificadoFirma);

      for (let i = 0; i < datosExcel.length; i++) {
        const filaExcel = datosExcel[i];

        // 1. Mapear datos según configuración
        const datosMapeados: DatosCertificado = {};

        for (const [campoDestino, columnaExcel] of mapeo.entries()) {
          datosMapeados[campoDestino] = String(filaExcel[columnaExcel] || '');
        }

        // 2. Buscar o crear participante y curso
        const participanteId = await buscarOCrearParticipante(empresaId, datosMapeados);
        const cursoId = await buscarOCrearCurso(empresaId, datosMapeados);

        console.log(`   📋 IDs obtenidos - Participante: ${participanteId}, Curso: ${cursoId}`);

        // 3. Generar certificado (imagen) con posiciones fijas
        const certGenerado = await this.generarCertificado(
          empresaId,
          datosMapeados,
          loteId,
          textoEstatico,
          firmasIds // Pasar firmas
        );

        // 4. Guardar en base de datos con referencias normalizadas
        const certificado = certificadoRepo.create({
          codigo: certGenerado.codigo,
          empresa_id: empresaId,
          participante_id: participanteId,
          curso_id: cursoId,
          curso_nombre: datosMapeados['curso'] || null,
          horas_curso: datosMapeados['horas'] ? parseInt(datosMapeados['horas']) : null,
          lote_id: loteId,
          archivo_url: certGenerado.rutaArchivo,
          estado: EstadoCertificado.ACTIVO,
          fecha_emision: new Date()
        });

        await certificadoRepo.save(certificado);

        console.log(`   💾 Certificado guardado - ID: ${certificado.id}, Participante: ${certificado.participante_id}, Curso: ${certificado.curso_id}`);

        // 4b. Guardar relación certificado-firma
        if (firmasIds && firmasIds.length > 0) {
          for (let orden = 0; orden < firmasIds.length; orden++) {
            const certificadoFirma = certificadoFirmaRepo.create({
              certificadoId: certificado.id,
              firmaId: firmasIds[orden],
              orden: orden + 1,
              fechaAsignacion: new Date()
            });
            await certificadoFirmaRepo.save(certificadoFirma);
          }
          console.log(`   ✍️ ${firmasIds.length} firma(s) asociada(s) al certificado`);
        }

        // 5. Guardar datos individuales del certificado (para compatibilidad y búsqueda)
        const datosEntidades: DatoCertificado[] = [];

        for (const [campo, valor] of Object.entries(datosMapeados)) {
          const dato = datoCertificadoRepo.create({
            certificado_id: certificado.id,
            campo,
            valor
          });
          datosEntidades.push(dato);
        }

        // 🆕 GUARDAR EL NOMBRE ORIGINAL DEL EXCEL como _nombre_override
        const nombreDelExcel = datosMapeados['nombre'];
        if (nombreDelExcel && nombreDelExcel.trim()) {
          datosEntidades.push(
            datoCertificadoRepo.create({
              certificado_id: certificado.id,
              campo: '_nombre_override',
              valor: nombreDelExcel.trim()
            })
          );
          console.log(`   📝 Nombre del Excel guardado: "${nombreDelExcel.trim()}"`);
        }

        await datoCertificadoRepo.save(datosEntidades);

        certificadosGenerados.push(certGenerado);

        // Log de progreso cada 10 certificados
        if ((i + 1) % 10 === 0 || i === datosExcel.length - 1) {
          console.log(`   ✓ Generados ${i + 1}/${datosExcel.length} certificados`);
        }
      }

      console.log(`✅ Lote completado: ${certificadosGenerados.length} certificados generados`);

      return certificadosGenerados;
    } catch (error) {
      console.error('Error al generar lote:', error);
      throw new Error('Error al generar lote de certificados');
    }
  }

  /**
   * Crea un archivo ZIP con todos los certificados
   */
  static async crearZip(
    certificados: CertificadoGenerado[],
    empresaId: number,
    loteId: number
  ): Promise<string> {
    try {
      // Crear directorio para ZIPs si no existe
      const zipDir = path.join(process.cwd(), 'public', 'downloads');
      
      if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir, { recursive: true });
      }

      // Nombre del archivo ZIP
      const zipFilename = `lote-${loteId}-${Date.now()}.zip`;
      const zipPath = path.join(zipDir, zipFilename);

      // Crear stream de escritura
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Máxima compresión
      });

      // Manejar errores
      archive.on('error', (err) => {
        throw err;
      });

      // Pipe del archivo
      archive.pipe(output);

      // Agregar cada certificado al ZIP
      for (const cert of certificados) {
        const rutaCompleta = path.join(process.cwd(), 'public', cert.rutaArchivo);
        const nombreEnZip = `${cert.nombreCompleto.replace(/[^a-zA-Z0-9]/g, '_')}-${cert.codigo}.pdf`;

        archive.file(rutaCompleta, { name: nombreEnZip });
      }

      // Finalizar archivo
      await archive.finalize();

      // Esperar a que termine de escribir
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', reject);
      });

      console.log(`📦 ZIP creado: ${zipFilename} (${archive.pointer()} bytes)`);

      // Retornar ruta relativa
      return `/downloads/${zipFilename}`;
    } catch (error) {
      console.error('Error al crear ZIP:', error);
      throw new Error('Error al crear archivo ZIP');
    }
  }

  /**
   * Obtiene un certificado por su código (para validación)
   */
  static async obtenerPorCodigo(codigo: string): Promise<ResultadoValidacion> {
    try {
      const certificadoRepo = AppDataSource.getRepository(Certificado);
      const datoCertificadoRepo = AppDataSource.getRepository(DatoCertificado);

      // Buscar certificado
      const certificado = await certificadoRepo.findOne({
        where: { codigo },
        relations: ['empresa']
      });

      if (!certificado) {
        return {
          valido: false,
          mensaje: 'Certificado no encontrado'
        };
      }

      // Obtener datos del certificado
      const datos = await datoCertificadoRepo.find({
        where: { certificado_id: certificado.id }
      });

      const datosFormateados: { [campo: string]: string } = {};
      datos.forEach(dato => {
        datosFormateados[dato.campo] = dato.valor;
      });

      // Validar estado
      if (certificado.estado === EstadoCertificado.REVOCADO) {
        return {
          valido: false,
          certificado: {
            codigo: certificado.codigo,
            empresa: certificado.empresa.nombre,
            logoEmpresa: certificado.empresa.logo || undefined,
            fechaEmision: certificado.fecha_emision,
            estado: certificado.estado,
            archivoUrl: certificado.archivo_url,
            datos: datosFormateados
          },
          mensaje: 'Este certificado ha sido revocado'
        };
      }

      return {
        valido: true,
        certificado: {
          codigo: certificado.codigo,
          empresa: certificado.empresa.nombre,
          logoEmpresa: certificado.empresa.logo || undefined,
          fechaEmision: certificado.fecha_emision,
          estado: certificado.estado,
          archivoUrl: certificado.archivo_url,
          datos: datosFormateados
        }
      };
    } catch (error) {
      console.error('Error al obtener certificado:', error);
      throw new Error('Error al validar certificado');
    }
  }

  /**
   * Revoca un certificado (cambia su estado)
   */
  static async revocarCertificado(codigo: string): Promise<boolean> {
    try {
      const certificadoRepo = AppDataSource.getRepository(Certificado);

      const certificado = await certificadoRepo.findOne({
        where: { codigo }
      });

      if (!certificado) {
        return false;
      }

      certificado.estado = EstadoCertificado.REVOCADO;
      await certificadoRepo.save(certificado);

      console.log(`🚫 Certificado revocado: ${codigo}`);

      return true;
    } catch (error) {
      console.error('Error al revocar certificado:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de certificados de una empresa
   */
  static async obtenerEstadisticas(empresaId: number): Promise<{
    total: number;
    activos: number;
    revocados: number;
    esteMes: number;
  }> {
    try {
      const certificadoRepo = AppDataSource.getRepository(Certificado);

      const total = await certificadoRepo.count({
        where: { empresa_id: empresaId }
      });

      const activos = await certificadoRepo.count({
        where: { empresa_id: empresaId, estado: EstadoCertificado.ACTIVO }
      });

      const revocados = await certificadoRepo.count({
        where: { empresa_id: empresaId, estado: EstadoCertificado.REVOCADO }
      });

      // Certificados de este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const esteMes = await certificadoRepo
        .createQueryBuilder('certificado')
        .where('certificado.empresa_id = :empresaId', { empresaId })
        .andWhere('certificado.fecha_emision >= :inicioMes', { inicioMes })
        .getCount();

      return {
        total,
        activos,
        revocados,
        esteMes
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al obtener estadísticas');
    }
  }

  /**
   * Busca certificados por nombre o código
   */
  static async buscarCertificados(
    empresaId: number,
    termino: string,
    limite: number = 10
  ): Promise<Array<{
    codigo: string;
    nombreCompleto: string;
    fechaEmision: Date;
    estado: EstadoCertificado;
  }>> {
    try {
      const certificadoRepo = AppDataSource.getRepository(Certificado);
      const datoCertificadoRepo = AppDataSource.getRepository(DatoCertificado);

      // Buscar por código
      let certificados = await certificadoRepo
        .createQueryBuilder('certificado')
        .where('certificado.empresa_id = :empresaId', { empresaId })
        .andWhere('certificado.codigo LIKE :termino', { termino: `%${termino}%` })
        .limit(limite)
        .getMany();

      // Si no hay resultados, buscar por nombre en datos
      if (certificados.length === 0) {
        const datosConNombre = await datoCertificadoRepo
          .createQueryBuilder('dato')
          .innerJoin('dato.certificado', 'certificado')
          .where('certificado.empresa_id = :empresaId', { empresaId })
          .andWhere('dato.campo IN (:...campos)', { campos: ['nombre', 'nombreCompleto'] })
          .andWhere('dato.valor LIKE :termino', { termino: `%${termino}%` })
          .limit(limite)
          .getMany();

        const certificadoIds = datosConNombre.map(d => d.certificado_id);
        
        if (certificadoIds.length > 0) {
          certificados = await certificadoRepo
            .createQueryBuilder('certificado')
            .whereInIds(certificadoIds)
            .getMany();
        }
      }

      // Obtener nombres de cada certificado
      const resultados = [];
      for (const cert of certificados) {
        const datoNombre = await datoCertificadoRepo.findOne({
          where: [
            { certificado_id: cert.id, campo: 'nombre' },
            { certificado_id: cert.id, campo: 'nombreCompleto' }
          ]
        });

        resultados.push({
          codigo: cert.codigo,
          nombreCompleto: datoNombre?.valor || 'Sin nombre',
          fechaEmision: cert.fecha_emision,
          estado: cert.estado
        });
      }

      return resultados;
    } catch (error) {
      console.error('Error al buscar certificados:', error);
      throw new Error('Error al buscar certificados');
    }
  }

  /**
   * Obtiene la configuración estándar (útil para previsualizaciones)
   */
  static obtenerConfigEstandar() {
    return CONFIG_ESTANDAR;
  }
    
  static async regenerarCertificado(certificadoId: number): Promise<CertificadoGenerado> {
    try {
      const certificadoRepo = AppDataSource.getRepository(Certificado);
      const datoCertificadoRepo = AppDataSource.getRepository(DatoCertificado);
      const loteRepo = AppDataSource.getRepository(Lote);
      const certificadoFirmaRepo = AppDataSource.getRepository(CertificadoFirma);

      // 1. Obtener certificado
      const certificado = await certificadoRepo.findOne({
        where: { id: certificadoId }
      });

      if (!certificado) {
        throw new Error('Certificado no encontrado');
      }

      // 2. Obtener lote para recuperar texto_estatico
      const lote = await loteRepo.findOne({
        where: { id: certificado.lote_id }
      });

      const textoEstatico = lote?.texto_estatico || undefined;
      console.log(`🔄 Regenerando certificado ${certificado.codigo}`);
      console.log(`   📝 Texto estático del lote: ${textoEstatico ? 'Recuperado' : 'No disponible'}`);

      // 3. Obtener datos del certificado
      const datos = await datoCertificadoRepo.find({
        where: { certificado_id: certificadoId }
      });

      const datosMapeados: DatosCertificado = {};
      datos.forEach(dato => {
        datosMapeados[dato.campo] = dato.valor;
      });

      // 4. Obtener firmas del certificado
      const certificadoFirmas = await certificadoFirmaRepo.find({
        where: { certificadoId: certificadoId },
        order: { orden: 'ASC' }
      });
      const firmasIds = certificadoFirmas.map(cf => cf.firmaId);

      // 5. Regenerar certificado con el texto estático guardado
      const certGenerado = await this.generarCertificado(
        certificado.empresa_id,
        datosMapeados,
        certificado.lote_id,
        textoEstatico,  // 🆕 Usar texto estático del lote
        firmasIds.length > 0 ? firmasIds : undefined
      );

      // 6. Actualizar URL del archivo en BD
      certificado.archivo_url = certGenerado.rutaArchivo;
      await certificadoRepo.save(certificado);

      console.log(`   ✅ Certificado regenerado exitosamente`);

      return certGenerado;
    } catch (error) {
      console.error('Error al regenerar certificado:', error);
      throw new Error(`Error al regenerar certificado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Regenera todos los certificados de un lote
   */
  static async regenerarLote(loteId: number): Promise<CertificadoGenerado[]> {
    try {
      const certificadoRepo = AppDataSource.getRepository(Certificado);
      const loteRepo = AppDataSource.getRepository(Lote);

      // 1. Obtener lote con texto_estatico
      const lote = await loteRepo.findOne({
        where: { id: loteId }
      });

      if (!lote) {
        throw new Error('Lote no encontrado');
      }

      console.log(`🔄 Regenerando lote ${loteId}`);
      console.log(`   📝 Texto estático: ${lote.texto_estatico ? 'Disponible' : 'No disponible'}`);

      // 2. Obtener todos los certificados del lote
      const certificados = await certificadoRepo.find({
        where: { lote_id: loteId }
      });

      console.log(`   📋 ${certificados.length} certificados a regenerar`);

      // 3. Regenerar cada certificado
      const certificadosGenerados: CertificadoGenerado[] = [];

      for (let i = 0; i < certificados.length; i++) {
        const cert = certificados[i];
        
        try {
          const certGenerado = await this.regenerarCertificado(cert.id);
          certificadosGenerados.push(certGenerado);

          if ((i + 1) % 10 === 0 || i === certificados.length - 1) {
            console.log(`   ✓ Regenerados ${i + 1}/${certificados.length} certificados`);
          }
        } catch (error) {
          console.error(`   ❌ Error regenerando certificado ${cert.codigo}:`, error);
        }
      }

      console.log(`✅ Lote regenerado: ${certificadosGenerados.length}/${certificados.length} exitosos`);

      return certificadosGenerados;
    } catch (error) {
      console.error('Error al regenerar lote:', error);
      throw new Error(`Error al regenerar lote: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}