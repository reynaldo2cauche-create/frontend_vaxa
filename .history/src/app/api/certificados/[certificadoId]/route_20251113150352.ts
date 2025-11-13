// ============================================
// API: POST /api/certificados/[certificadoId]/regenerar
// CORREGIDO: Leer texto de bloque_texto en vez de dato_certificado
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';
import { Certificado } from '@/lib/entities/Certificado';
import { DatoCertificado } from '@/lib/entities/DatoCertificado';
import { CertificadoFirma } from '@/lib/entities/CertificadoFirma';
import { FirmaDigital } from '@/lib/entities/FirmaDigital';
import { PDFService } from '@/lib/services/PDFService';
import { QRService } from '@/lib/services/QRService';
import { PlantillaService } from '@/lib/services/PlantillaService';
import path from 'path';
import fs from 'fs';

const CONFIG_ESTANDAR = {
  QR: {
    baseSize: 180
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { certificadoId: string } }
) {
  try {
    const certificadoId = parseInt(params.certificadoId);

    if (isNaN(certificadoId)) {
      return NextResponse.json(
        { error: 'ID de certificado inválido' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const nombrePersonalizado = body.nombrePersonalizado || null;

    const dataSource = await getDataSource();
    const certificadoRepo = dataSource.getRepository(Certificado);

    // Obtener el certificado con todas sus relaciones
    const certificado = await certificadoRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participante', 'p')
      .leftJoinAndSelect('c.lote', 'l')
      .leftJoinAndSelect('l.empresa', 'e')
      .leftJoinAndSelect('c.datos', 'd')
      .where('c.id = :certificadoId', { certificadoId })
      .getOne();

    if (!certificado) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    if (!certificado.lote || !certificado.participante) {
      return NextResponse.json(
        { error: 'Certificado sin lote o participante asociado' },
        { status: 400 }
      );
    }

    console.log(`🔄 Regenerando certificado ${certificado.id} para participante ${certificado.participante.id}`);
    console.log(`   Empresa ID: ${certificado.lote.empresa.id}`);
    console.log(`   Lote ID: ${certificado.lote.id}`);

    // 1. Obtener plantilla con logos
    console.log(`   📋 Obteniendo plantilla...`);
    const plantilla = await PlantillaService.obtenerPlantillaBasica(certificado.lote.empresa.id);
    console.log(`   ✅ Plantilla obtenida:`, plantilla ? 'OK' : 'NULL');

    if (!plantilla) {
      return NextResponse.json(
        { error: 'No hay plantilla para esta empresa' },
        { status: 404 }
      );
    }

    // 2. Obtener firmas del certificado original
    console.log(`   ✍️  Obteniendo firmas...`);
    const certificadoFirmasRepo = dataSource.getRepository(CertificadoFirma);
    const certificadoFirmas = await certificadoFirmasRepo
      .createQueryBuilder('cf')
      .where('cf.certificadoId = :certificadoId', { certificadoId })
      .orderBy('cf.orden', 'ASC')
      .getMany();

    const firmasParaCertificado = [];
    if (certificadoFirmas.length > 0) {
      const firmaIds = certificadoFirmas.map(cf => cf.firmaId);
      const firmasRepo = dataSource.getRepository(FirmaDigital);
      const firmas = await firmasRepo
        .createQueryBuilder('f')
        .where('f.id IN (:...ids)', { ids: firmaIds })
        .getMany();

      for (const cf of certificadoFirmas) {
        const firma = firmas.find(f => f.id === cf.firmaId);
        if (firma) {
          firmasParaCertificado.push({
            id: firma.id,
            nombre: firma.nombre,
            cargo: firma.cargo,
            firmaUrl: firma.firmaUrl
          });
        }
      }
    }
    console.log(`   ✅ Firmas obtenidas: ${firmasParaCertificado.length}`);

    // ============================================
    // 🆕 3. OBTENER TEXTO DE BLOQUE_TEXTO (NO DE DATO_CERTIFICADO)
    // ============================================
    console.log(`📋 === BUSCANDO TEXTO EN BLOQUE_TEXTO ===`);
    
    let titulo = 'CERTIFICADO DE PARTICIPACIÓN';
    let textoCompletado = 'Por haber completado exitosamente';

    try {
      // 🆕 Buscar en la tabla bloque_texto asociada al lote
      const bloqueTextoResult = await dataSource.query(`
        SELECT tipo, contenido 
        FROM bloque_texto 
        WHERE lote_id = ? 
        ORDER BY id DESC 
        LIMIT 1
      `, [certificado.lote.id]);

      console.log(`📋 Resultado query bloque_texto:`, bloqueTextoResult);

      if (bloqueTextoResult && bloqueTextoResult.length > 0) {
        const bloque = bloqueTextoResult[0];
        
        if (bloque.tipo === 'estatico' && bloque.contenido) {
          textoCompletado = bloque.contenido;
          console.log(`✅ Texto estático encontrado en bloque_texto: "${textoCompletado.substring(0, 100)}..."`);
        } else if (bloque.tipo === 'plantilla') {
          console.log(`ℹ️ Bloque tipo plantilla encontrado, usando texto de plantilla`);
          // Aquí podrías obtener el texto de la plantilla si lo necesitas
        }
      } else {
        console.log(`⚠️ No se encontró bloque_texto para lote_id ${certificado.lote.id}`);
      }
    } catch (error) {
      console.error(`❌ Error al buscar en bloque_texto:`, error);
    }

    // Fallback: buscar en dato_certificado (compatibilidad con código anterior)
    if (textoCompletado === 'Por haber completado exitosamente') {
      console.log(`🔍 Buscando en dato_certificado como fallback...`);
      const tituloGuardado = certificado.datos.find(d => d.campo === '_titulo');
      const cuerpoGuardado = certificado.datos.find(d => d.campo === '_cuerpo');

      if (tituloGuardado && tituloGuardado.valor) {
        titulo = tituloGuardado.valor;
        console.log(`✅ Título encontrado en dato_certificado: "${titulo}"`);
      }

      if (cuerpoGuardado && cuerpoGuardado.valor) {
        textoCompletado = cuerpoGuardado.valor;
        console.log(`✅ Cuerpo encontrado en dato_certificado: "${textoCompletado}"`);
      }
    }

    console.log(`\n📝 TEXTO FINAL PARA PDF:`);
    console.log(`   Título: "${titulo}"`);
    console.log(`   Cuerpo: "${textoCompletado}"`);
    console.log(`\n`);

    // 4. Generar QR con el mismo código
    const qrDataURL = await QRService.generarQRParaCertificado(
      certificado.codigo,
      CONFIG_ESTANDAR.QR.baseSize
    );

    // 5. Construir nombre completo ACTUALIZADO
    let nombreCompleto: string;

    if (nombrePersonalizado) {
      nombreCompleto = nombrePersonalizado.trim();
      console.log(`   🆕 Usando nombre personalizado de la petición: "${nombreCompleto}"`);
    } else {
      const nombreOverride = certificado.datos.find(d => d.campo === '_nombre_override');

      if (nombreOverride && nombreOverride.valor) {
        nombreCompleto = nombreOverride.valor.trim();
        console.log(`   ✏️ Usando nombre override guardado: "${nombreCompleto}"`);
      } else {
        nombreCompleto = [
          certificado.participante.termino,
          certificado.participante.nombres
        ].filter(Boolean).join(' ').trim();
        console.log(`   👤 Usando nombre del participante: "${nombreCompleto}"`);
      }
    }

    // 6. Obtener datos adicionales del certificado
    const datosAdicionales: { [key: string]: string } = {};
    certificado.datos.forEach(dato => {
      datosAdicionales[dato.campo] = dato.valor;
    });

    // 7. Preparar datos para el PDF
    const datosPDF = {
      titulo: titulo,
      nombre: nombreCompleto,
      curso: certificado.lote.curso || 'Sin curso',
      fecha: datosAdicionales['Fecha de Emisión'] || datosAdicionales['fecha'] || new Date().toLocaleDateString('es-PE'),
      horas: datosAdicionales['Horas Académicas'] || datosAdicionales['horas'] || '',
      cuerpo: textoCompletado  // 🆕 Ahora usa el texto de bloque_texto
    };

    console.log(`   📄 Datos del PDF:`, datosPDF);

    // 8. Ruta del PDF existente
    const pdfPath = path.join(process.cwd(), 'public', certificado.archivo_url);
    console.log(`   📁 Ruta PDF: ${pdfPath}`);

    // 9. Regenerar el PDF con los datos actualizados
    console.log(`   🎨 Generando PDF...`);

    await PDFService.generarCertificadoPDF({
      plantillaFondo: plantilla.fondo,
      logoEmpresa: plantilla.logo || undefined,
      logos: plantilla.logos.map(logo => ({
        url: logo.url,
        posicion: logo.posicion
      })),
      firmas: firmasParaCertificado,
      datos: datosPDF,
      codigo: certificado.codigo,
      qrDataURL: qrDataURL,
      outputPath: pdfPath
    });

    // 🆕 Si se proporcionó un nombre personalizado, guardarlo
    if (nombrePersonalizado) {
      const datoCertificadoRepo = dataSource.getRepository(DatoCertificado);
      const overrideExistente = certificado.datos.find(d => d.campo === '_nombre_override');

      if (overrideExistente) {
        overrideExistente.valor = nombrePersonalizado;
        await datoCertificadoRepo.save(overrideExistente);
      } else {
        const nuevoOverride = datoCertificadoRepo.create({
          certificado_id: certificado.id,
          campo: '_nombre_override',
          valor: nombrePersonalizado
        });
        await datoCertificadoRepo.save(nuevoOverride);
      }
      console.log(`   💾 Nombre override guardado en BD`);
    }

    console.log(`✅ PDF regenerado exitosamente`);
    console.log(`   Código: ${certificado.codigo}`);
    console.log(`   Participante actualizado: ${nombreCompleto}`);
    console.log(`   PDF: ${certificado.archivo_url}`);

    return NextResponse.json({
      success: true,
      certificado: {
        id: certificado.id,
        codigo: certificado.codigo,
        archivo_url: certificado.archivo_url,
        participante: nombreCompleto
      }
    });

  } catch (error) {
    console.error('❌ ERROR COMPLETO al regenerar certificado:');
    console.error('   Tipo:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Mensaje:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('   Error completo:', error);

    return NextResponse.json(
      {
        error: 'Error al regenerar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================
// RESUMEN DEL CAMBIO:
// ============================================

/*
ANTES: Buscaba en dato_certificado (tabla equivocada)
const cuerpoGuardado = certificado.datos.find(d => d.campo === '_cuerpo');

AHORA: Busca en bloque_texto (tabla correcta)
SELECT tipo, contenido FROM bloque_texto WHERE lote_id = ?

Si encuentra tipo='estatico', usa ese contenido para el PDF
*/