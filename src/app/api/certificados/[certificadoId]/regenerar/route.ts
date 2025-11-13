// ============================================
// API: POST /api/certificados/[certificadoId]/regenerar
// Regenera el PDF de un certificado manteniendo el mismo código
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

    // 🆕 Obtener nombre personalizado del body (opcional)
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

    // Obtener las firmas reales por sus IDs
    const firmasParaCertificado = [];
    if (certificadoFirmas.length > 0) {
      const firmaIds = certificadoFirmas.map(cf => cf.firmaId);
      const firmasRepo = dataSource.getRepository(FirmaDigital);
      const firmas = await firmasRepo
        .createQueryBuilder('f')
        .where('f.id IN (:...ids)', { ids: firmaIds })
        .getMany();

      // Ordenar firmas según el orden de certificadoFirmas
      for (const cf of certificadoFirmas) {
        const firma = firmas.find(f => f.id === cf.firmaId);
        if (firma) {
          firmasParaCertificado.push({
            id: firma.id,
            nombre: firma.nombre,
            cargo: firma.cargo,
            firmaUrl: firma.firmaUrl  // ⭐ Usar firmaUrl (camelCase) como viene de TypeORM
          });
        }
      }
    }
    console.log(`   ✅ Firmas obtenidas: ${firmasParaCertificado.length}`);
    console.log(`   📋 Detalle de firmas:`, JSON.stringify(firmasParaCertificado, null, 2));

  // En la API de regeneración, reemplaza la sección de textos:

// 3. Obtener textos del certificado ORIGINAL
console.log(`📋 === DEBUG DATOS CERTIFICADO ===`);
console.log(`📋 Total de datos: ${certificado.datos.length}`);
console.log(`📋 TODOS LOS DATOS GUARDADOS:`);
certificado.datos.forEach((d, i) => {
  console.log(`   ${i + 1}. Campo: "${d.campo}" => Valor: "${d.valor?.substring(0, 100)}..."`);
});
console.log(`📋 ================================`);

let titulo = 'CERTIFICADO DE PARTICIPACIÓN';
let textoCompletado = 'Por haber completado exitosamente';

// Buscar título y cuerpo guardados en los datos del certificado
const tituloGuardado = certificado.datos.find(d => d.campo === '_titulo');
const cuerpoGuardado = certificado.datos.find(d => d.campo === '_cuerpo');

console.log(`🔍 Búsqueda de campos:`);
console.log(`   _titulo encontrado: ${tituloGuardado ? 'SÍ' : 'NO'}`);
console.log(`   _cuerpo encontrado: ${cuerpoGuardado ? 'SÍ' : 'NO'}`);

if (tituloGuardado && tituloGuardado.valor) {
  titulo = tituloGuardado.valor;
  console.log(`✅ Usando título original: "${titulo}"`);
} else {
  console.log('⚠️ No se encontró _titulo guardado, usando valor por defecto');
}

if (cuerpoGuardado && cuerpoGuardado.valor) {
  textoCompletado = cuerpoGuardado.valor;
  console.log(`✅ Usando cuerpo original: "${textoCompletado}"`);
} else {
  console.log('⚠️ No se encontró _cuerpo guardado');

  // Fallback: buscar otros posibles nombres de campo
  const posiblesCuerpos = certificado.datos.filter(d =>
    d.campo.toLowerCase().includes('cuerpo') ||
    d.campo.toLowerCase().includes('texto') ||
    d.campo.toLowerCase().includes('descripcion')
  );

  console.log(`🔍 Campos posibles encontrados: ${posiblesCuerpos.length}`);
  posiblesCuerpos.forEach(d => {
    console.log(`   - "${d.campo}": "${d.valor?.substring(0, 100)}"`);
  });

  if (posiblesCuerpos.length > 0) {
    textoCompletado = posiblesCuerpos[0].valor;
    console.log(`✅ Usando campo alternativo: "${posiblesCuerpos[0].campo}"`);
  } else {
    // ⚠️ ATENCIÓN: No hay texto guardado para este certificado
    // Esto NO debería ocurrir si se generó correctamente
    console.error('❌ ERROR: No se encontró texto estático guardado para este certificado');
    console.error('   El certificado debe regenerarse desde cero con texto estático nuevo');
    textoCompletado = 'Por haber completado exitosamente'; // Valor por defecto mínimo
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
    // ⭐ PRIORIDAD: nombrePersonalizado > _nombre_override guardado > nombre del participante
    let nombreCompleto: string;

    if (nombrePersonalizado) {
      // Si viene nombre personalizado en la petición, usarlo
      nombreCompleto = nombrePersonalizado.trim();
      console.log(`   🆕 Usando nombre personalizado de la petición: "${nombreCompleto}"`);
    } else {
      // Buscar si hay un override guardado
      const nombreOverride = certificado.datos.find(d => d.campo === '_nombre_override');

      if (nombreOverride && nombreOverride.valor) {
        nombreCompleto = nombreOverride.valor.trim();
        console.log(`   ✏️ Usando nombre override guardado: "${nombreCompleto}"`);
      } else {
        // Usar nombre del participante (comportamiento original)
        nombreCompleto = [
          certificado.participante.termino,
          certificado.participante.nombres // Ya incluye nombres + apellidos
        ].filter(Boolean).join(' ').trim();
        console.log(`   👤 Usando nombre del participante: "${nombreCompleto}"`);
      }
    }

    // 6. Obtener datos adicionales del certificado
    const datosAdicionales: { [key: string]: string } = {};
    certificado.datos.forEach(dato => {
      datosAdicionales[dato.campo] = dato.valor;
    });

    // 7. Preparar datos para el PDF (usar los mismos campos que en la generación original)
    const datosPDF = {
      titulo: titulo,
      nombre: nombreCompleto, // NOMBRE ACTUALIZADO
      curso: certificado.lote.curso || 'Sin curso',
      fecha: datosAdicionales['Fecha de Emisión'] || datosAdicionales['fecha'] || new Date().toLocaleDateString('es-PE'),
      horas: datosAdicionales['Horas Académicas'] || datosAdicionales['horas'] || '',
      cuerpo: textoCompletado
    };

    console.log(`   📄 Datos del PDF:`, datosPDF);

    // 8. Ruta del PDF existente
    const pdfPath = path.join(process.cwd(), 'public', certificado.archivo_url);
    console.log(`   📁 Ruta PDF: ${pdfPath}`);

    // 9. Regenerar el PDF con los datos actualizados
    console.log(`   🎨 Generando PDF...`);
    console.log(`   📊 Datos para generación de PDF:`);
    console.log(`      - Firmas a incluir: ${firmasParaCertificado.length}`);
    if (firmasParaCertificado.length > 0) {
      firmasParaCertificado.forEach((f, i) => {
        console.log(`      - Firma ${i + 1}: ${f.nombre} (${f.cargo}) - URL: ${f.firmaUrl}`);
      });
    }

    await PDFService.generarCertificadoPDF({
      plantillaFondo: plantilla.fondo,
      logoEmpresa: plantilla.logo || undefined,
      logos: plantilla.logos.map(logo => ({
        url: logo.url,
        posicion: logo.posicion
      })),
      firmas: firmasParaCertificado, // ⭐ FIRMAS DIGITALES
      datos: datosPDF,
      codigo: certificado.codigo, // MISMO CÓDIGO
      qrDataURL: qrDataURL,
      outputPath: pdfPath // Sobrescribir el archivo existente
    });

    // 🆕 Si se proporcionó un nombre personalizado, guardarlo en dato_certificado
    if (nombrePersonalizado) {
      const datoCertificadoRepo = dataSource.getRepository(DatoCertificado);

      // Verificar si ya existe un override
      const overrideExistente = certificado.datos.find(d => d.campo === '_nombre_override');

      if (overrideExistente) {
        // Actualizar existente
        overrideExistente.valor = nombrePersonalizado;
        await datoCertificadoRepo.save(overrideExistente);
        console.log(`   💾 Nombre override actualizado en BD`);
      } else {
        // Crear nuevo
        const nuevoOverride = datoCertificadoRepo.create({
          certificado_id: certificado.id,
          campo: '_nombre_override',
          valor: nombrePersonalizado
        });
        await datoCertificadoRepo.save(nuevoOverride);
        console.log(`   💾 Nombre override guardado en BD`);
      }
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
